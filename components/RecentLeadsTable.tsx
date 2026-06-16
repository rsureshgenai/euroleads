import Link from 'next/link'
import type { Lead } from '@/types'
import { stageColor, confidenceColor, scoreColor, formatDate } from '@/lib/utils'

export default function RecentLeadsTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <div className="card text-center text-sm text-ink-500">
        No leads yet. Leads extracted by the AI pipeline will appear here.
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-400">
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Country / Sector</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50">
              <td className="px-4 py-3">
                <Link href={`/leads/${lead.id}`} className="font-medium text-ink-900 hover:text-brand-600">
                  {lead.company_name}
                </Link>
                <div className="mt-0.5">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${confidenceColor(lead.confidence)}`}>
                    {lead.confidence}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-ink-600">
                {lead.country} · {lead.sector}
              </td>
              <td className={`px-4 py-3 font-semibold ${scoreColor(lead.score)}`}>{lead.score}</td>
              <td className="px-4 py-3">
                <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${stageColor(lead.stage)}`}>
                  {lead.stage}
                </span>
              </td>
              <td className="px-4 py-3 text-ink-500">{formatDate(lead.last_activity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
