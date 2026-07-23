import { PostgrestClient } from '@supabase/postgrest-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Self-hosted PostgREST (see postgrest/README.md) serves tables at the bare
// root, not under /rest/v1 like Supabase's gateway — so we talk to it via
// the underlying postgrest-js client directly instead of supabase-js's
// createClient, which always hardcodes that /rest/v1 prefix.
export const supabase = new PostgrestClient(supabaseUrl, { schema: 'public' })
