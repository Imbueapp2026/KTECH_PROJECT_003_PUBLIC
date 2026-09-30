/**
 * Supabase client configuration for public app
 * Uses anon key for public access with RLS enforcement
 * 
 * Browser: Uses singleton pattern to prevent multiple client instances
 * Server: Creates fresh client per request to avoid session leakage
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';

// Browser-side singleton (client-only)
let cachedClient: SupabaseClient | null = null;

export const getAnonClient = (): SupabaseClient => {
  if (typeof globalThis.WebSocket === 'undefined') {
    class MockWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = MockWebSocket.OPEN;
      constructor() {}
      addEventListener() {}
      removeEventListener() {}
      send() {}
      close() {}
    }

    // @ts-expect-error - polyfill for environments without native WebSocket support
    globalThis.WebSocket = MockWebSocket;
  }

  // Server-side: always create fresh client to avoid session leakage
  if (typeof window === 'undefined') {
    const env = getEnv();
    return createClient(env.supabaseUrl, env.supabaseAnonKey);
  }

  // Browser-side: use singleton
  if (cachedClient) return cachedClient;
  const env = getEnv();
  cachedClient = createClient(env.supabaseUrl, env.supabaseAnonKey);
  return cachedClient;
};
