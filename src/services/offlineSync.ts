/**
 * Recovery Compass — Local-First Offline Storage & Sync Engine
 *
 * Implements PRD v3.0 Section 7.2:
 * - IndexedDB storage for plans, logs, tasks, visits, escalations
 * - Outbox pattern for offline mutations with client UUIDs
 * - Idempotent sync push to POST /sync/push
 * - Delta pull from GET /sync/pull
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

  // Queue offline mutation to outbox
  async queueMutation(mutation: OutboxMutation): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction('outbox', 'readwrite');
      tx.objectStore('outbox').put(mutation);
    } catch (err) {
      // Fallback to localStorage if IndexedDB is blocked
      const queue = JSON.parse(localStorage.getItem('rc_offline_outbox') || '[]');
      queue.push(mutation);
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
      const queue = JSON.parse(localStorage.getItem('rc_offline_outbox') || '[]');
      const filtered = queue.filter((m: any) => m.id !== id);
      localStorage.setItem('rc_offline_outbox', JSON.stringify(filtered));
    }
  }

  // Save current recovery plan locally
  async savePlanSnapshot(plan: any): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction('plans', 'readwrite');
      tx.objectStore('plans').put(plan);
    } catch {
      localStorage.setItem('rc_recovery_plan_snapshot', JSON.stringify({ plan, timestamp: Date.now() }));
    }
  }

  // Save caseload locally for offline use
  async saveCaseload(caseload: any[]): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction('caseload', 'readwrite');
      const store = tx.objectStore('caseload');
      for (const item of caseload) {
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
    const token = localStorage.getItem('recovery_compass_access_token');
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
        // Clear synced mutations
        for (const m of mutations) {
          await this.clearMutation(m.id);
        }
        return { success: true, syncedCount: mutations.length };
      }
    } catch (e) {
      console.warn('Sync outbox push failed (offline):', e);
    }

    return { success: false, syncedCount: 0 };
  }
}

export const offlineStorage = new OfflineStorageEngine();
