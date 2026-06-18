import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Public endpoint — no auth required. Called by n8n to fetch target countries/sectors.
// Only returns countries and sectors; other settings columns are intentionally omitted.
export async function GET() {
  try {
    const supabase = getSupabaseServiceClient()

    const { data, error } = await supabase
      .from('settings')
      .select('countries, sectors')
      .eq('id', 'default')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Settings fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({
      countries: data?.countries ?? [],
      sectors: data?.sectors ?? [],
    })
  } catch (err: any) {
    console.error('Settings error:', err)
    return NextResponse.json({ error: 'Internal error', details: err.message }, { status: 500 })
  }
}
