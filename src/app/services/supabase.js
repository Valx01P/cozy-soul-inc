import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for server-side usage
// We only use this on the server side, never on the client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase


/**
 * Example Supabase Response:
 * {
 *   data: {
 *    id: '123',
 *    first_name: 'John',
 *    last_name: 'Doe',
 *    email: 'john.doe@example.com'
 *   },
 *   error: null
 * }
 *
 * This response structure is used for user data retrieval.
 * Ensure to handle the error case appropriately in your implementation.
 * 
 * Example Supabase Response with Error:
 * {
 *  data: null,
 *  error: {
 *    message: 'User not found',
 *    code: '404'
 *  }
 * }
 *
 * Example Supabase Response with Success:
 * {
 *   data: {
 *    id: '123',
 *    first_name: 'John',
 *    last_name: 'Doe',
 *    email: 'john.doe@example.com'
 *   },
 *   error: null
 * }
 */