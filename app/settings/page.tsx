import AppShell from '@/components/AppShell'
import SettingsForm from '@/components/SettingsForm'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { TargetSettings } from '@/types'

export const dynamic = 'force-dynamic'

const DEFAULT_SETTINGS: TargetSettings = {
  countries: ['Croatia', 'Serbia', 'United Arab Emirates'],
  sectors: ['Hospitality', 'Construction', 'Healthcare', 'Logistics'],
  brochure_url: null,
  email_subject_template: 'Skilled Workforce Solutions for {{company_name}}',
  email_body_template:
    'Hi {{contact_name}},\n\nWe noticed {{company_name}} may be expanding its team in {{country}}. ' +
    'SIS International specializes in sourcing skilled talent from India for roles across Europe and the Middle East.\n\n' +
    'I have attached our brochure with more details. Happy to set up a quick call this week.\n\nBest regards,\nSuresh',
}

export default async function SettingsPage() {
  const supabase = getSupabaseServerClient()

  const { data } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle()

  const settings: TargetSettings = data
    ? {
        countries: data.countries || DEFAULT_SETTINGS.countries,
        sectors: data.sectors || DEFAULT_SETTINGS.sectors,
        brochure_url: data.brochure_url,
        email_subject_template: data.email_subject_template || DEFAULT_SETTINGS.email_subject_template,
        email_body_template: data.email_body_template || DEFAULT_SETTINGS.email_body_template,
      }
    : DEFAULT_SETTINGS

  return (
    <AppShell title="Settings">
      <SettingsForm initialSettings={settings} />
    </AppShell>
  )
}
