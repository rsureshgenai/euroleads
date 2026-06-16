import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRouteClient } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseRouteClient()
  const { data, error } = await supabase.from('leads').select('*').eq('id', params.id).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ lead: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseRouteClient()
  const body = await req.json()

  const allowedFields = ['notes', 'stage', 'contact_email', 'contact_website', 'score', 'confidence']
  const updates: Record<string, any> = { last_activity: new Date().toISOString() }
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseRouteClient()
  const { error } = await supabase.from('leads').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
