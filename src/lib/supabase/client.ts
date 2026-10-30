/**
 * Recovery Compass — Supabase Browser Client
 *
 * Uses the publishable (anon) key only — safe for the browser.
 * Server-side secrets (service role key) NEVER come here.
 *
 * This client handles:
 *   - User authentication (sign in, sign up, session restore)
 *   - Realtime subscriptions for live processing status
 *   - Row-level-security enforced data reads
 *
 * All data mutations that require elevated privileges go through
 * the Node.js API which uses the backend Supabase client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ── Demo / local development fallback ──────────────────────────────────────
// When keys are not configured the client is unavailable — surfaced as null.
// NEVER silently substitute mock data here.
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-ref')) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'rc_session',
    },
    realtime: {
      params: {
        eventsPerSecond: 5,
      },
    },
  });
}

export { supabase };

/**
 * Returns true if a real Supabase client is configured.
 * The application should surface a clear message when this is false.
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

/**
 * Throw a clear error if Supabase is not configured.
 * Use this guard at the top of functions that require Supabase.
 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.',
    );
  }
  return supabase;
}
