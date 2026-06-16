export type Confidence = 'high' | 'medium' | 'low'

export type Stage =
  | 'New'
  | 'Contacted'
  | 'Replied'
  | 'Call Set'
  | 'Proposal'
  | 'Partner'

export const STAGES: Stage[] = [
  'New',
  'Contacted',
  'Replied',
  'Call Set',
  'Proposal',
  'Partner',
]

export interface Lead {
  id: string
  company_name: string
  country: string
  sector: string
  evidence: string
  contact_email: string | null
  contact_website: string | null
  source_url: string | null
  confidence: Confidence
  score: number
  stage: Stage
  last_activity: string | null
  notes: string | null
  created_at: string
}

export type EmailDirection = 'sent' | 'received'

export interface EmailLog {
  id: string
  lead_id: string
  direction: EmailDirection
  subject: string
  body: string
  created_at: string
}

export interface AppUser {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'member'
}

export interface ExtractedLead {
  company_name: string
  country: string
  sector: string
  evidence: string
  contact_email: string | null
  contact_website: string | null
  confidence: Confidence
  score: number
}

export interface TargetSettings {
  countries: string[]
  sectors: string[]
  brochure_url: string | null
  email_subject_template: string
  email_body_template: string
}
