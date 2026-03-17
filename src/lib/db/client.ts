/**
 * Database-layer Supabase client helpers.
 *
 * Two clients are exposed:
 *   - createBrowserDbClient  – for use inside Client Components (anon key)
 *   - createServerDbClient   – for use in Server Components / Route Handlers
 *                              (service role key when available, otherwise anon key)
 *
 * Both return `null` when the required environment variables are absent so that
 * callers can branch to the mock-data path without throwing at runtime.
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Configuration guard
// ---------------------------------------------------------------------------

/** Returns true when every required Supabase env var is present. */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ---------------------------------------------------------------------------
// Browser client  (anon key, used by client components)
// ---------------------------------------------------------------------------

/**
 * Creates a Supabase JS client suitable for browser / Client Component use.
 * Returns `null` when env vars are missing (triggers mock-data fallback).
 */
export function createBrowserDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Server / admin client  (service role key preferred, anon key fallback)
// ---------------------------------------------------------------------------

/**
 * Creates a Supabase JS client for server-side use (Route Handlers, Server
 * Actions, Server Components).  Uses the service role key when available so
 * that Row-Level Security policies do not interfere with server operations.
 * Returns `null` when env vars are missing (triggers mock-data fallback).
 */
export function createServerDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) return null;

  // Prefer the service role key so RLS never blocks server-side mutations.
  const key = serviceKey ?? anonKey;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
