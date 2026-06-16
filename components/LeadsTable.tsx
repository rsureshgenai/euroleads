'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Mail, ExternalLink, Search, Loader2, CheckCircle2 } from 'lucide-react'
import type { Lead, Confidence, Stage } from '@/types'
import { STAGES } from '@/types'
import { stageColor, confidenceColor, scoreColor, formatDate } from '@/lib/utils'
import EmailSentModal, { type EmailSendResult } from './EmailSentModal'

export default function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [sector, setSector] = useState('all')
  const [confidence, setConfidence] = useState<'all' | Confidence>('all')
  const [stage, setStage] = useState<'all' | Stage>('all')
  const [minScore, setMinScore] = useState(0)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [emailResult, setEmailResult] = useState<EmailSendResult | null>(null)

  const countries = useMemo(
    () => Array.from(new Set(leads.map((l) => l.country))).sort(),
    [leads]
  )
  const sectors = useMemo(
    () => Array.from(new Set(leads.map((l) => l.sector))).sort(),
    [leads]
  )

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (search && !l.company_name.toLowerCase().includes(search.toLowerCase())) return false
      if (country !== 'all' && l.country !== country) return false
      if (sector !== 'all' && l.sector !== sector) return false
      if (confidence !== 'all' && l.confidence !== confidence) return false
      if (stage !== 'all' && l.stage !== stage) return false
      if (l.score < minScore) return false
      return true
    })
  }, [leads, search, country, sector, confidence, stage, minScore])

  async function handleSendEmail(lead: Lead) {
    setSendingId(lead.id)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message = body?.error || body?.details || 'Could not trigger email automation.'
        setEmailResult({ status: 'error', companyName: lead.company_name, message })
        return
      }

      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? { ...l, stage: l.stage === 'New' ? 'Contacted' : l.stage, last_activity: new Date().toISOString() }
            : l
        )
      )
      setSentIds((prev) => new Set(prev).add(lead.id))
      setTimeout(() => {
        setSentIds((prev) => {
          const next = new Set(prev)
          next.delete(lead.id)
          return next
        })
      }, 3000)
      setEmailResult({
        status: 'success',
        companyName: lead.company_name,
        email: lead.contact_email || '',
      })
    } catch (err: any) {
      console.error(err)
      setEmailResult({
        status: 'error',
        companyName: lead.company_name,
        message: err?.message || 'Could not trigger email automation.',
      })
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <EmailSentModal result={emailResult} onClose={() => setEmailResult(null)} />

      {/* Filters */}
      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-ink-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company..."
            className="input-base pl-9"
          />
        </div>

        <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-base">
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={sector} onChange={(e) => setSector(e.target.value)} className="input-base">
          <option value="all">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={confidence}
          onChange={(e) => setConfidence(e.target.value as 'all' | Confidence)}
          className="input-base"
        >
          <option value="all">All confidence</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as 'all' | Stage)}
          className="input-base"
        >
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-6">
          <label className="whitespace-nowrap text-xs font-medium text-ink-500">
            Min score: {minScore}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>
      </div>

      <p className="text-xs text-ink-500">
        Showing {filtered.length} of {leads.length} leads
      </p>

      {/* Desktop table */}
      <div className="card hidden overflow-x-auto p-0 lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-400">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Country / Sector</th>
              <th className="px-4 py-3">Evidence</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Last activity</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
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
                <td className="px-4 py-3 text-ink-600">{lead.country} · {lead.sector}</td>
                <td className="max-w-[220px] px-4 py-3 text-ink-500">
                  <p className="line-clamp-2 italic">&ldquo;{lead.evidence}&rdquo;</p>
                </td>
                <td className={`px-4 py-3 font-semibold ${scoreColor(lead.score)}`}>{lead.score}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${stageColor(lead.stage)}`}>
                    {lead.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-500">{formatDate(lead.last_activity)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleSendEmail(lead)}
                      disabled={sendingId === lead.id}
                      className="flex items-center gap-1.5 rounded-md bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                      title="Send templated email with brochure via n8n"
                    >
                      {sendingId === lead.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : sentIds.has(lead.id) ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <Mail size={13} />
                      )}
                      {sentIds.has(lead.id) ? 'Sent' : 'Email'}
                    </button>
                    {lead.source_url && (
                      <a
                        href={lead.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-md bg-ink-50 px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100"
                      >
                        <ExternalLink size={13} />
                        Source
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-500">No leads match your filters.</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((lead) => (
          <div key={lead.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/leads/${lead.id}`} className="font-medium text-ink-900 hover:text-brand-600">
                  {lead.company_name}
                </Link>
                <p className="text-xs text-ink-500">{lead.country} · {lead.sector}</p>
              </div>
              <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${stageColor(lead.stage)}`}>
                {lead.stage}
              </span>
            </div>

            <p className="line-clamp-2 text-xs italic text-ink-500">&ldquo;{lead.evidence}&rdquo;</p>

            <div className="flex items-center gap-3 text-xs">
              <span className={`font-semibold ${scoreColor(lead.score)}`}>Score: {lead.score}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${confidenceColor(lead.confidence)}`}>
                {lead.confidence}
              </span>
              <span className="text-ink-400">{formatDate(lead.last_activity)}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleSendEmail(lead)}
                disabled={sendingId === lead.id}
                className="btn-primary flex-1 py-1.5 text-xs"
              >
                {sendingId === lead.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : sentIds.has(lead.id) ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Mail size={13} />
                )}
                {sentIds.has(lead.id) ? 'Sent' : 'Email + Brochure'}
              </button>
              {lead.source_url && (
                <a
                  href={lead.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary py-1.5 text-xs"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-500">No leads match your filters.</p>
        )}
      </div>
    </div>
  )
}
