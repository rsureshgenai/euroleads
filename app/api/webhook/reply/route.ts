import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-server'

// n8n calls this endpoint when it detects an inbound reply email (e.g. via an
// IMAP/Gmail trigger node matching a lead's contact_email). It updates the
// lead's stage to "Replied" and stores the reply in email_logs.
//
// Security: n8n must send the shared secret in the "x-webhook-secret" header.
export async function POST(req: NextRequest) {
  const incomingSecret = req.headers.get('x-webhook-secret')
  if (!process.env.WEBHOOK_SHARED_SECRET || incomingSecret !== process.env.WEBHOOK_SHARED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { leadId, fromEmail, subject, body: emailBody } = body

    if (!subject || !emailBody) {
      return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
    }
    if (!leadId && !fromEmail) {
      return NextResponse.json({ error: 'leadId or fromEmail is required to identify the lead' }, { status: 400 })
    }

    const supabase = getSupabaseServiceClient()

    let lead
    if (leadId) {
      const { data } = await supabase.from('leads').select('*').eq('id', leadId).single()
      lead = data
    } else {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('contact_email', fromEmail)
        .limit(1)
        .maybeSingle()
      lead = data
    }

    if (!lead) {
      return NextResponse.json({ error: 'No matching lead found' }, { status: 404 })
    }

    // Log the reply
    const { error: logError } = await supabase.from('email_logs').insert({
      lead_id: lead.id,
      direction: 'received',
      subject,
      body: emailBody,
    })

    if (logError) {
      return NextResponse.json({ error: 'Failed to log reply', details: logError.message }, { status: 500 })
    }

    // Update lead stage to Replied (unless already further along the pipeline)
    const advancedStages = ['Call Set', 'Proposal', 'Partner']
    const updates: Record<string, any> = { last_activity: new Date().toISOString() }
    if (!advancedStages.includes(lead.stage)) {
      updates.stage = 'Replied'
    }

    const { error: updateError } = await supabase.from('leads').update(updates).eq('id', lead.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update lead', details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, leadId: lead.id, newStage: updates.stage || lead.stage })
  } catch (err: any) {
    console.error('Webhook reply error:', err)
    return NextResponse.json({ error: 'Internal error', details: err.message }, { status: 500 })
  }
}
