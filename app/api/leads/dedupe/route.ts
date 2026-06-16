import { NextRequest, NextResponse } from 'next/server'
import { extractLeadFromText } from '@/lib/groq'
import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { normalizeCompanyKey } from '@/lib/utils'

// Batch version of /api/extract — accepts an array of { rawText, sourceUrl }
// items (e.g. multiple search results from one n8n run), extracts each via
// Groq, and inserts only non-duplicate leads.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items: Array<{ rawText: string; sourceUrl?: string }> = body.items || []

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()

    const { data: existingLeads } = await supabase.from('leads').select('company_name, country')
    const seenKeys = new Set(
      (existingLeads || []).map((l) => normalizeCompanyKey(l.company_name, l.country))
    )

    const results: any[] = []

    for (const item of items) {
      const extracted = await extractLeadFromText(item.rawText)

      if (!extracted) {
        results.push({ inserted: false, reason: 'no lead found' })
        continue
      }

      const key = normalizeCompanyKey(extracted.company_name, extracted.country)
      if (seenKeys.has(key)) {
        results.push({ inserted: false, reason: 'duplicate', company: extracted.company_name })
        continue
      }
      seenKeys.add(key)

      const { data: inserted, error } = await supabase
        .from('leads')
        .insert({
          company_name: extracted.company_name,
          country: extracted.country,
          sector: extracted.sector,
          evidence: extracted.evidence,
          contact_email: extracted.contact_email,
          contact_website: extracted.contact_website,
          source_url: item.sourceUrl || null,
          confidence: extracted.confidence,
          score: extracted.score,
          stage: 'New',
          last_activity: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        results.push({ inserted: false, reason: error.message, company: extracted.company_name })
      } else {
        results.push({ inserted: true, lead: inserted })
      }
    }

    const insertedCount = results.filter((r) => r.inserted).length
    return NextResponse.json({ total: items.length, inserted: insertedCount, results })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal error', details: err.message }, { status: 500 })
  }
}
