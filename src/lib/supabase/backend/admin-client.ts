/**
 * Recovery Compass — Supabase Backend (Server-Side) Client
 *
 * Uses the SERVICE ROLE key — full database access, bypasses RLS.
 * NEVER expose this key to the browser or to end users.
 *
 * Usage:
 *  - File uploads to Supabase Storage
 *  - Admin operations that must bypass RLS
 *  - Realtime event publishing from the server
 *
 * The anon key client (for user-scoped operations) is on the frontend.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;

/**
 * Get the singleton Supabase admin client.
 * Initialised lazily so it can read env vars after NestJS ConfigModule loads.
 *
 * Throws a clear error if the environment variables are missing.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || url.includes('your-project-ref')) {
    throw new Error(
      '[Supabase] SUPABASE_URL is not configured. ' +
      'Set it in backend/.env from your Supabase project settings.',
    );
  }

  if (!serviceKey || serviceKey === 'your-supabase-service-role-key') {
    throw new Error(
      '[Supabase] SUPABASE_SECRET_KEY (service role key) is not configured. ' +
      'Set it in backend/.env from your Supabase project settings → API → service_role.',
    );
  }

  _adminClient = createClient(url, serviceKey, {
    auth: {
      // Disable session persistence — this is a server-side client
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // Identify requests from the Recovery Compass backend
        'x-application-name': 'recovery-compass-backend',
      },
    },
  });

  return _adminClient;
}

/**
 * Returns true if Supabase credentials are properly configured.
 * Use this guard before calling getSupabaseAdminClient() in optional paths.
 */
export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  return (
    Boolean(url) &&
    !url!.includes('your-project-ref') &&
    Boolean(key) &&
    key !== 'your-supabase-service-role-key'
  );
}
