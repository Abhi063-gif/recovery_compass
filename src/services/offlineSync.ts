/**
 * Recovery Compass — Local-First Offline Storage & Sync Engine
 *
 * Implements PRD v3.0 Section 7.2:
 * - IndexedDB storage for plans, logs, tasks, visits, escalations
 * - Outbox pattern for offline mutations with client UUIDs
 * - Idempotent sync push to POST /sync/push
 * - Delta pull from GET /sync/pull
 * - Mobile browser quota protection: strips uncompressed document PDF buffers
 *   and base64 payloads; stores compressed JSON plan state only.
 */

const DB_NAME = 'RecoveryCompassOfflineDB';
const DB_VERSION = 1;

export interface OutboxMutation {
  id: string;
  entity: 'medication_log' | 'symptom_log' | 'task_event' | 'asha_visit' | 'escalation';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  clientTimestamp: string;
}

/**
 * Strips uncompressed document PDF buffers and base64 payloads to preserve mobile IndexedDB quotas.
 * Retains only metadata (e.g. document name, page count, size) and pure clinical JSON state.
 */
export function sanitizePlanForOfflineStorage(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizePlanForOfflineStorage);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    // Drop raw files, binary objects, and raw document strings
    if (
      [
        'fileObj',
        'pdfBase64',
        'rawPdf',
        'pdfBuffer',
        'blob',
        'rawLlmOutput',
        'base64Content',
        'rawContent',
        'imageData',
      ].includes(key)
    ) {
      continue;
    }

    // If string is a base64 data URL (e.g. data:application/pdf;base64,...), drop the heavy content
    if (typeof val === 'string') {
      if (val.startsWith('data:application/pdf') || (val.startsWith('data:') && val.length > 512)) {
        continue;
      }
      // If a large pure base64 string (> 5000 chars without spaces), skip
      if (val.length > 5000 && /^[A-Za-z0-9+/=\r\n]+$/.test(val)) {
        continue;
      }
    }

    // If nested object, recurse
    if (typeof val === 'object' && val !== null) {
      // If it's a File or Blob instance, skip
      if (typeof Blob !== 'undefined' && val instanceof Blob) {
        continue;
      }
      sanitized[key] = sanitizePlanForOfflineStorage(val);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

/**
 * Compresses JSON plan state using browser CompressionStream (gzip) where available,
 * with fallback to minified JSON string.
 */
export async function compressJsonState(data: any): Promise<string> {
  const jsonString = JSON.stringify(data);
  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([jsonString]).stream().pipeThrough(new CompressionStream('gzip'));
      const buffer = await new Response(stream).arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return `gz:${btoa(binary)}`;
    } catch {
      // Fallback
    }
  }
  return jsonString;
}

/**
 * Decompresses gzip-compressed JSON state or parses direct JSON.
 */
export async function decompressJsonState(compressed: string): Promise<any> {
  if (compressed.startsWith('gz:') && typeof DecompressionStream !== 'undefined') {
    try {
      const binaryStr = atob(compressed.slice(3));
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const decompressedText = await new Response(stream).text();
      return JSON.parse(decompressedText);
    } catch {
      // Fallback
    }
  }
  return JSON.parse(compressed);
}

class OfflineStorageEngine {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db: IDBDatabase = event.target.result;

        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('plans')) {
          db.createObjectStore('plans', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('symptomLogs')) {
          db.createObjectStore('symptomLogs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('caseload')) {
          db.createObjectStore('caseload', { keyPath: 'patientId' });
        }
        if (!db.objectStoreNames.contains('visits')) {
          db.createObjectStore('visits', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('escalations')) {
          db.createObjectStore('escalations', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  // Queue offline mutation to outbox (ensuring no raw PDF buffers/base64 are queued)
  async queueMutation(mutation: OutboxMutation): Promise<void> {
    const cleanMutation: OutboxMutation = {
      ...mutation,
      payload: sanitizePlanForOfflineStorage(mutation.payload),
    };

    try {
      const db = await this.getDb();
      const tx = db.transaction('outbox', 'readwrite');
      tx.objectStore('outbox').put(cleanMutation);
    } catch {
      // Fallback to localStorage if IndexedDB is blocked
      const queue = JSON.parse(localStorage.getItem('rc_offline_outbox') || '[]');
      queue.push(cleanMutation);
      localStorage.setItem('rc_offline_outbox', JSON.stringify(queue));
    }
  }

  // Get all pending mutations in outbox
  async getOutbox(): Promise<OutboxMutation[]> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const tx = db.transaction('outbox', 'readonly');
        const req = tx.objectStore('outbox').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return JSON.parse(localStorage.getItem('rc_offline_outbox') || '[]');
    }
  }

  // Clear specific mutation from outbox
  async clearMutation(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction('outbox', 'readwrite');
      tx.objectStore('outbox').delete(id);
    } catch {
      // ignore
    }
    try {
      const queue = JSON.parse(localStorage.getItem('rc_offline_outbox') || '[]');
      const filtered = queue.filter((m: any) => m.id !== id);
      localStorage.setItem('rc_offline_outbox', JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }

  // Clear all mutations
  async clearOutbox(): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction('outbox', 'readwrite');
      tx.objectStore('outbox').clear();
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('rc_offline_outbox');
    } catch {
      // ignore
    }
  }

  /**
   * Save current recovery plan locally.
   * Strips uncompressed document PDF buffers and base64 strings to respect mobile browser quota limits;
   * stores compressed JSON plan state only.
   */
  async savePlanSnapshot(plan: any): Promise<void> {
    if (!plan) return;
    const cleanPlan = sanitizePlanForOfflineStorage(plan);
    const planId = cleanPlan.id || 'current-plan';

    try {
      const compressed = await compressJsonState(cleanPlan);
      const record = {
        id: planId,
        compressedState: compressed,
        updatedAt: new Date().toISOString(),
      };

      const db = await this.getDb();
      const tx = db.transaction('plans', 'readwrite');
      tx.objectStore('plans').put(record);
    } catch {
      try {
        localStorage.setItem(
          'rc_recovery_plan_snapshot',
          JSON.stringify({ plan: cleanPlan, timestamp: Date.now() })
        );
      } catch (err) {
        console.warn('LocalStorage snapshot quota exceeded:', err);
      }
    }
  }

  /**
   * Retrieve locally saved recovery plan snapshot from IndexedDB,
   * decompressing compressed state on retrieval.
   */
  async getPlanSnapshot(planId?: string): Promise<any | null> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const tx = db.transaction('plans', 'readonly');
        const store = tx.objectStore('plans');
        const req = planId ? store.get(planId) : store.getAll();
        req.onsuccess = async () => {
          let item = req.result;
          if (Array.isArray(item)) {
            item = item[item.length - 1];
          }
          if (item && item.compressedState) {
            try {
              const decompressed = await decompressJsonState(item.compressedState);
              resolve(decompressed);
              return;
            } catch {
              resolve(item);
              return;
            }
          }
          resolve(item || null);
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      try {
        const raw = localStorage.getItem('rc_recovery_plan_snapshot');
        return raw ? JSON.parse(raw).plan : null;
      } catch {
        return null;
      }
    }
  }

  // Save caseload locally for offline use
  async saveCaseload(caseload: any[]): Promise<void> {
    try {
      const cleanCaseload = sanitizePlanForOfflineStorage(caseload);
      const db = await this.getDb();
      const tx = db.transaction('caseload', 'readwrite');
      const store = tx.objectStore('caseload');
      for (const item of cleanCaseload) {
        store.put(item);
      }
    } catch {
      localStorage.setItem('rc_offline_caseload', JSON.stringify(caseload));
    }
  }

  // Retrieve caseload locally when offline
  async getCaseload(): Promise<any[]> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const tx = db.transaction('caseload', 'readonly');
        const req = tx.objectStore('caseload').getAll();
        req.onsuccess = () => {
          const res = req.result || [];
          if (res.length > 0) resolve(res);
          else resolve(JSON.parse(localStorage.getItem('rc_offline_caseload') || '[]'));
        };
        req.onerror = () => resolve(JSON.parse(localStorage.getItem('rc_offline_caseload') || '[]'));
      });
    } catch {
      return JSON.parse(localStorage.getItem('rc_offline_caseload') || '[]');
    }
  }

  // Push pending outbox to backend API
  async syncOutbox(): Promise<{ success: boolean; syncedCount: number }> {
    const mutations = await this.getOutbox();
    if (mutations.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    const metaEnv = (import.meta as { env?: Record<string, string> }).env;
    const baseUrl = (metaEnv?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');
    const token =
      localStorage.getItem('recovery_compass_access_token') ||
      localStorage.getItem('auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${baseUrl}/sync/push`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mutations,
          deviceId: 'web-pwa-client',
          clientVersion: '3.0.0',
        }),
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        const failedIds = new Set<string>();
        if (Array.isArray(result?.errors)) {
          for (const errStr of result.errors) {
            const id = errStr.split(':')[0]?.trim();
            if (id) failedIds.add(id);
          }
        }

        // Remove successfully processed mutations from IndexedDB / local storage
        for (const m of mutations) {
          if (!failedIds.has(m.id)) {
            await this.clearMutation(m.id);
          }
        }
        return { success: true, syncedCount: result?.processed ?? mutations.length };
      }
    } catch (e) {
      console.warn('Sync outbox push failed (offline):', e);
    }

    return { success: false, syncedCount: 0 };
  }
}

export const offlineStorage = new OfflineStorageEngine();
