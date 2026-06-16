import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRouteClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = getSupabaseRouteClient()
  const { searchParams } = new URL(req.url)

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

  const country = searchParams.get('country')
  const sector = searchParams.get('sector')
  const stage = searchParams.get('stage')
  const confidence = searchParams.get('confidence')
  const minScore = searchParams.get('minScore')

  if (country) query = query.eq('country', country)
  if (sector) query = query.eq('sector', sector)
  if (stage) query = query.eq('stage', stage)
  if (confidence) query = query.eq('confidence', confidence)
  if (minScore) query = query.gte('score', Number(minScore))

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ leads: data })
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseRouteClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('leads')
    .insert({
      company_name: body.company_name,
      country: body.country,
      sector: body.sector,
      evidence: body.evidence,
      contact_email: body.contact_email || null,
      contact_website: body.contact_website || null,
      source_url: body.source_url || null,
      confidence: body.confidence || 'low',
      score: body.score ?? 0,
      stage: body.stage || 'New',
      last_activity: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lead: data }, { status: 201 })
}
