'use client'

import { useState } from 'react'
import { Save, Loader2, CheckCircle2, Upload, FileText, Search } from 'lucide-react'
import type { TargetSettings } from '@/types'
import TagInput from './TagInput'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function SettingsForm({ initialSettings }: { initialSettings: TargetSettings }) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [triggeringSearch, setTriggeringSearch] = useState(false)

  const supabase = getSupabaseBrowserClient()

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase.from('settings').upsert({
      id: 'default',
      countries: settings.countries,
      sectors: settings.sectors,
      brochure_url: settings.brochure_url,
      email_subject_template: settings.email_subject_template,
      email_body_template: settings.email_body_template,
    })
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      alert('Failed to save settings.')
    }
  }

  async function handleBrochureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const bucket = process.env.NEXT_PUBLIC_BROCHURE_BUCKET || 'brochures'
      const filePath = `brochure-${Date.now()}.pdf`

      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
        upsert: true,
      })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
      setSettings((prev) => ({ ...prev, brochure_url: urlData.publicUrl }))
    } catch (err: any) {
      alert(err.message || 'Failed to upload brochure. Ensure the storage bucket exists.')
    } finally {
      setUploading(false)
    }
  }

  async function handleTriggerSearch() {
    setTriggeringSearch(true)
    try {
      const res = await fetch('/api/leads/search-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countries: settings.countries, sectors: settings.sectors }),
      })
      if (!res.ok) throw new Error()
      alert('Search automation triggered in n8n. New leads will appear once processed.')
    } catch {
      alert('Could not trigger search webhook. Check N8N_SEARCH_WEBHOOK_URL configuration.')
    } finally {
      setTriggeringSearch(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="card">
        <h3 className="mb-4 text-sm font-medium text-ink-700">Targeting</h3>
        <div className="space-y-5">
          <TagInput
            label="Target countries"
            items={settings.countries}
            onChange={(countries) => setSettings((prev) => ({ ...prev, countries }))}
            placeholder="e.g. Croatia"
          />
          <TagInput
            label="Target sectors"
            items={settings.sectors}
            onChange={(sectors) => setSettings((prev) => ({ ...prev, sectors }))}
            placeholder="e.g. Hospitality"
          />
        </div>

        <button
          onClick={handleTriggerSearch}
          disabled={triggeringSearch}
          className="btn-secondary mt-5"
        >
          {triggeringSearch ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Trigger n8n search now
        </button>
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-medium text-ink-700">Brochure</h3>
        {settings.brochure_url ? (
          <a
            href={settings.brochure_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center gap-2 rounded-md bg-ink-50 px-3 py-2 text-sm text-brand-600 hover:bg-ink-100"
          >
            <FileText size={16} />
            View current brochure
          </a>
        ) : (
          <p className="mb-3 text-sm text-ink-400">No brochure uploaded yet.</p>
        )}
        <label className="btn-secondary inline-flex w-fit cursor-pointer">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Uploading...' : 'Upload brochure (PDF)'}
          <input type="file" accept="application/pdf" onChange={handleBrochureUpload} className="hidden" />
        </label>
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-medium text-ink-700">Email template</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500">Subject</label>
            <input
              value={settings.email_subject_template}
              onChange={(e) => setSettings((prev) => ({ ...prev, email_subject_template: e.target.value }))}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-500">Body</label>
            <textarea
              value={settings.email_body_template}
              onChange={(e) => setSettings((prev) => ({ ...prev, email_body_template: e.target.value }))}
              rows={8}
              className="input-base resize-none font-mono text-xs"
            />
          </div>
          <p className="text-xs text-ink-400">
            Available variables: {'{{company_name}}'}, {'{{contact_name}}'}, {'{{country}}'}, {'{{sector}}'}
          </p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? (
          <Loader2 size={15} className="animate-spin" />
        ) : saved ? (
          <CheckCircle2 size={15} />
        ) : (
          <Save size={15} />
        )}
        {saved ? 'Saved' : 'Save settings'}
      </button>
    </div>
  )
}
