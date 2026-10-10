import type { Db } from '@/server/db/supabase'

// Tracer-bullet operation for the scaffold (issue 01). Goes when app_status does.
export async function getAppStatus(db: Db): Promise<string> {
  const { data, error } = await db
    .from('app_status')
    .select('message')
    .single()
  if (error) throw error
  return data.message
}
