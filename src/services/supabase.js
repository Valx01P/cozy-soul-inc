import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for server-side usage
// We only use this on the server side, never on the client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;