import { NextRequest, NextResponse } from 'next/server'

// Called from the Settings page "Trigger n8n search now" button.
// Forwards the current targeting criteria to the external n8n search workflow.
export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_SEARCH_WEBHOOK_URL

  if (!webhookUrl) {
    return NextResponse.json({ error: 'N8N_SEARCH_WEBHOOK_URL is not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countries: body.countries || [],
        sectors: body.sectors || [],
        triggeredAt: new Date().toISOString(),
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/leads/dedupe`,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'n8n webhook responded with an error' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to reach n8n webhook', details: err.message }, { status: 500 })
  }
}
