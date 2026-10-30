/**
 * Recovery Compass — Supabase Server Client
 *
 * Uses the SERVICE ROLE KEY — elevated access.
 * NEVER import this in any browser-facing file.
 * NEVER import this from src/ (frontend).
 *
 * This client is used by:
 *   - Document storage operations (private bucket access)
 *   - Server-to-server authenticated queries
 *   - RLS bypass where necessary (with explicit justification)
 *
 * The anon client is used for:
 *   - Token verification (verifying user JWT from frontend)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;
let _userClient: SupabaseClient | null = null;

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Ensure it is set in backend/.env before starting the server.`,
    );
  }
  return val;
}

/**
 * Supabase Admin Client (service role) — bypasses RLS.
 * Use ONLY for trusted server-side operations.
 * Never expose the service role key to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    const url = getEnv('SUPABASE_URL');
    const key = getEnv('SUPABASE_SECRET_KEY');

    if (url.includes('your-project-ref') || key.includes('your-supabase')) {
      throw new Error(
        'Supabase is not configured. Set real SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env.',
      );
    }

    _adminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _adminClient;
}

/**
 * Supabase Anon Client (publishable key) — respects RLS.
 * Use for token verification and user-scoped queries.
 */
export function getSupabaseAnon(): SupabaseClient {
  if (!_userClient) {
    const url = getEnv('SUPABASE_URL');
    const key = getEnv('SUPABASE_PUBLISHABLE_KEY');

    _userClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _userClient;
}

/**
 * Returns true if Supabase environment variables are configured.
 * Used by health checks — does NOT throw.
 */
export function isSupabaseConfigured(): boolean {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    return !!(url && key && !url.includes('your-project-ref') && !key.includes('your-supabase'));
  } catch {
    return false;
  }
}
