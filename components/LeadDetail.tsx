'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Globe, ExternalLink, Save, Loader2,
  ArrowDownLeft, ArrowUpRight, CheckCircle2,
} from 'lucide-react'
import type { Lead, EmailLog, Stage } from '@/types'
import { STAGES } from '@/types'
import { stageColor, confidenceColor, scoreColor, formatDateTime, formatDate } from '@/lib/utils'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import EmailSentModal, { type EmailSendResult } from './EmailSentModal'

export default function LeadDetail({ lead: initialLead, emailLogs }: { lead: Lead; emailLogs: EmailLog[] }) {
  const [lead, setLead] = useState(initialLead)
  const [notes, setNotes] = useState(lead.notes || '')
  const [stage, setStage] = useState<Stage>(lead.stage)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailResult, setEmailResult] = useState<EmailSendResult | null>(null)

  const supabase = getSupabaseBrowserClient()

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase
      .from('leads')
      .update({ notes, stage, last_activity: new Date().toISOString() })
      .eq('id', lead.id)

    setSaving(false)
    if (!error) {
      setLead((prev) => ({ ...prev, notes, stage }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      alert('Failed to save changes.')
    }
  }

  async function handleSendEmail() {
    setSendingEmail(true)
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

      if (lead.stage === 'New') {
        setStage('Contacted')
        setLead((prev) => ({ ...prev, stage: 'Contacted' }))
      }
      setEmailResult({
        status: 'success',
        companyName: lead.company_name,
        email: lead.contact_email || '',
      })
    } catch (err: any) {
      setEmailResult({
        status: 'error',
        companyName: lead.company_name,
        message: err?.message || 'Could not trigger email automation.',
      })
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      <EmailSentModal result={emailResult} onClose={() => setEmailResult(null)} />

      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700">
        <ArrowLeft size={15} />
        Back to leads
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink-900">{lead.company_name}</h2>
                <p className="mt-1 text-sm text-ink-500">{lead.country} · {lead.sector}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-3 py-1 text-xs font-medium ${confidenceColor(lead.confidence)}`}>
                  {lead.confidence} confidence
                </span>
                <span className={`text-lg font-semibold ${scoreColor(lead.score)}`}>{lead.score}</span>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-ink-50 p-3">
              <p className="text-xs font-medium text-ink-400">Evidence</p>
              <p className="mt-1 text-sm italic text-ink-700">&ldquo;{lead.evidence}&rdquo;</p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {lead.contact_email && (
                <a href={`mailto:${lead.contact_email}`} className="flex items-center gap-2 text-sm text-ink-700 hover:text-brand-600">
                  <Mail size={15} className="text-ink-400" />
                  {lead.contact_email}
                </a>
              )}
              {lead.contact_website && (
                <a href={lead.contact_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-ink-700 hover:text-brand-600">
                  <Globe size={15} className="text-ink-400" />
                  {lead.contact_website}
                </a>
              )}
              {lead.source_url && (
                <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-ink-700 hover:text-brand-600">
                  <ExternalLink size={15} className="text-ink-400" />
                  View source
                </a>
              )}
            </div>

            <button onClick={handleSendEmail} disabled={sendingEmail} className="btn-primary mt-5">
              {sendingEmail ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
              Send email with brochure
            </button>
          </div>

          {/* Notes */}
          <div className="card">
            <h3 className="mb-2 text-sm font-medium text-ink-700">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this lead..."
              className="input-base resize-none"
            />
          </div>

          {/* Email thread */}
          <div className="card">
            <h3 className="mb-4 text-sm font-medium text-ink-700">Email thread</h3>
            {emailLogs.length === 0 ? (
              <p className="text-sm text-ink-400">No emails yet. Outreach will appear here once triggered.</p>
            ) : (
              <div className="space-y-3">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-md border p-3 ${
                      log.direction === 'sent' ? 'border-brand-100 bg-brand-50' : 'border-sage-100 bg-sage-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {log.direction === 'sent' ? (
                          <ArrowUpRight size={13} className="text-brand-600" />
                        ) : (
                          <ArrowDownLeft size={13} className="text-sage-600" />
                        )}
                        <span className={log.direction === 'sent' ? 'text-brand-700' : 'text-sage-700'}>
                          {log.direction === 'sent' ? 'Sent' : 'Received'}
                        </span>
                      </div>
                      <span className="text-xs text-ink-400">{formatDateTime(log.created_at)}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-ink-800">{log.subject}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">{log.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: status */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-3 text-sm font-medium text-ink-700">Stage</h3>
            <span className={`mb-3 inline-block rounded-md px-3 py-1 text-xs font-medium ${stageColor(lead.stage)}`}>
              Current: {lead.stage}
            </span>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
              className="input-base"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button onClick={handleSave} disabled={saving} className="btn-sage mt-4 w-full">
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : saved ? (
                <CheckCircle2 size={15} />
              ) : (
                <Save size={15} />
              )}
              {saved ? 'Saved' : 'Save changes'}
            </button>
          </div>

          <div className="card space-y-2 text-sm">
            <h3 className="mb-2 text-sm font-medium text-ink-700">Meta</h3>
            <div className="flex justify-between text-ink-500">
              <span>Created</span>
              <span className="text-ink-700">{formatDate(lead.created_at)}</span>
            </div>
            <div className="flex justify-between text-ink-500">
              <span>Last activity</span>
              <span className="text-ink-700">{formatDate(lead.last_activity)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
