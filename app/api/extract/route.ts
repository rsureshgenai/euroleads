import { NextRequest, NextResponse } from 'next/server'
import { extractLeadFromText } from '@/lib/groq'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { normalizeCompanyKey } from '@/lib/utils'

// This endpoint is called by n8n after a search step returns raw result text.
// It extracts a structured lead via Groq, deduplicates by company+country,
// and inserts (or skips) the row in Supabase.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawText: string | undefined = body.rawText || body.text
    const sourceUrl: string | undefined = body.sourceUrl || body.source_url

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 })
    }

    const extracted = await extractLeadFromText(rawText)

    if (!extracted) {
      return NextResponse.json({ inserted: false, reason: 'No plausible lead found in text' }, { status: 200 })
    }

    const supabase = getSupabaseServiceClient()

    // Deduplicate by company_name + country
    const dedupeKey = normalizeCompanyKey(extracted.company_name, extracted.country)

    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, company_name, country')

    const isDuplicate = (existingLeads || []).some(
      (l) => normalizeCompanyKey(l.company_name, l.country) === dedupeKey
    )

    if (isDuplicate) {
      return NextResponse.json(
        { inserted: false, reason: 'Duplicate lead (same company + country already exists)', lead: extracted },
        { status: 200 }
      )
    }

    const { data: inserted, error } = await supabase
      .from('leads')
      .insert({
        company_name: extracted.company_name,
        country: extracted.country,
        sector: extracted.sector,
        evidence: extracted.evidence,
        contact_email: extracted.contact_email,
        contact_website: extracted.contact_website,
        source_url: sourceUrl || null,
        confidence: extracted.confidence,
        score: extracted.score,
        roles_needed: extracted.roles_needed ?? [],
        lead_type: extracted.lead_type ?? 'End Client',
        stage: 'New',
        last_activity: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'Failed to insert lead', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: true, lead: inserted }, { status: 201 })
  } catch (err: any) {
    console.error('Extraction error:', err)
    return NextResponse.json({ error: 'Internal error', details: err.message }, { status: 500 })
  }
}
