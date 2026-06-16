import AppShell from '@/components/AppShell'
import LeadsTable from '@/components/LeadsTable'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { Lead } from '@/types'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const supabase = getSupabaseServerClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <AppShell title="Leads">
      <LeadsTable initialLeads={(leads || []) as Lead[]} />
    </AppShell>
  )
}
