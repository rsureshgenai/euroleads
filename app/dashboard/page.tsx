import { Users, MessageSquareReply, PhoneCall, Handshake } from 'lucide-react'
import AppShell from '@/components/AppShell'
import StatCard from '@/components/StatCard'
import PipelineStrip from '@/components/PipelineStrip'
import RecentLeadsTable from '@/components/RecentLeadsTable'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { STAGES, type Stage, type Lead } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = getSupabaseServerClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  const allLeads = (leads || []) as Lead[]

  const total = allLeads.length
  const replied = allLeads.filter((l) => l.stage === 'Replied').length
  const inDiscussion = allLeads.filter((l) =>
    ['Call Set', 'Proposal'].includes(l.stage)
  ).length
  const partners = allLeads.filter((l) => l.stage === 'Partner').length

  const counts = STAGES.reduce((acc, stage) => {
    acc[stage] = allLeads.filter((l) => l.stage === stage).length
    return acc
  }, {} as Record<Stage, number>)

  const recent = allLeads.slice(0, 6)

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total leads" value={total} icon={Users} accent="brand" />
          <StatCard label="Replied" value={replied} icon={MessageSquareReply} accent="amber" />
          <StatCard label="In discussion" value={inDiscussion} icon={PhoneCall} accent="ink" />
          <StatCard label="Partners" value={partners} icon={Handshake} accent="sage" />
        </div>

        <PipelineStrip counts={counts} />

        <div>
          <h3 className="mb-3 text-sm font-medium text-ink-700">Recent activity</h3>
          <RecentLeadsTable leads={recent} />
        </div>
      </div>
    </AppShell>
  )
}
