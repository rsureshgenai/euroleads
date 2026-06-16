import { notFound } from 'next/navigation'
import AppShell from '@/components/AppShell'
import LeadDetail from '@/components/LeadDetail'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { Lead, EmailLog } from '@/types'

export const dynamic = 'force-dynamic'

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient()

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!lead) notFound()

  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('*')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: true })

  return (
    <AppShell title={lead.company_name}>
      <LeadDetail lead={lead as Lead} emailLogs={(emailLogs || []) as EmailLog[]} />
    </AppShell>
  )
}
