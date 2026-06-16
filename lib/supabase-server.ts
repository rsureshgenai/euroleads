import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Use inside Server Components
export function getSupabaseServerClient() {
  return createServerComponentClient({ cookies })
}

// Use inside Route Handlers (app/api/**)
export function getSupabaseRouteClient() {
  return createRouteHandlerClient({ cookies })
}

// Service-role client for trusted server-only operations (webhooks, AI extraction inserts).
// NEVER import this into client components.
export function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
