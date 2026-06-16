import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseRouteClient } from '@/lib/supabase-server'

// Called when the user clicks "Email" on a lead row or the lead detail page.
// Fetches lead + email template from Supabase, fills the template, calls the
// n8n "send email" webhook (which actually dispatches the email + brochure PDF),
// then logs the sent email and advances the stage if it was still "New".
export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_SEND_EMAIL_WEBHOOK_URL

  if (!webhookUrl) {
    return NextResponse.json({ error: 'N8N_SEND_EMAIL_WEBHOOK_URL is not configured' }, { status: 500 })
  }

  try {
    const { leadId } = await req.json()
    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const supabase = getSupabaseRouteClient()

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (!lead.contact_email) {
      return NextResponse.json({ error: 'Lead has no contact email on file' }, { status: 400 })
    }

    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()

    const subjectTemplate = settings?.email_subject_template || 'Solutions for {{company_name}}'
    const bodyTemplate =
      settings?.email_body_template ||
      'Hi,\n\nWe would love to connect with {{company_name}} regarding opportunities in {{country}}.\n\nBest regards'

    const fillTemplate = (tpl: string) =>
      tpl
        .replace(/{{company_name}}/g, lead.company_name)
        .replace(/{{country}}/g, lead.country)
        .replace(/{{sector}}/g, lead.sector)
        .replace(/{{contact_name}}/g, lead.contact_email?.split('@')[0] || 'there')

    const subject = fillTemplate(subjectTemplate)
    const emailBody = fillTemplate(bodyTemplate)

    // Trigger n8n: it handles actual SMTP send + attaching the brochure PDF
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        to: lead.contact_email,
        subject,
        body: emailBody,
        brochureUrl: settings?.brochure_url || null,
        companyName: lead.company_name,
        country: lead.country,
        sector: lead.sector,
      }),
    })

    if (!webhookRes.ok) {
      return NextResponse.json({ error: 'n8n email webhook responded with an error' }, { status: 502 })
    }

    // Log the sent email
    await supabase.from('email_logs').insert({
      lead_id: lead.id,
      direction: 'sent',
      subject,
      body: emailBody,
    })

    // Advance stage New -> Contacted
    const updates: Record<string, any> = { last_activity: new Date().toISOString() }
    if (lead.stage === 'New') updates.stage = 'Contacted'

    await supabase.from('leads').update(updates).eq('id', lead.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Email send error:', err)
    return NextResponse.json({ error: 'Internal error', details: err.message }, { status: 500 })
  }
}
