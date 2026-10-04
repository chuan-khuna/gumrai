import { createServerClient } from '@/server/supabase'

// Tracer-bullet operation for the scaffold (issue 01). Goes when app_status does.
export async function getAppStatus(): Promise<string> {
  const { data, error } = await createServerClient()
    .from('app_status')
    .select('message')
    .single()
  if (error) throw error
  return data.message
}
