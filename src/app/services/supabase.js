// src/app/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    },
    // Add cache configuration
    global: {
      fetch: fetch.bind(globalThis),
    },
    // Add reasonable timeouts
    db: {
      schema: 'public',
    },
    realtime: {
      timeout: 10000, // 10 seconds
    },
  }
);

export default supabase;