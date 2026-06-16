import Groq from 'groq-sdk'
import type { ExtractedLead } from '@/types'

let client: Groq | null = null

function getClient() {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return client
}

const EXTRACTION_SYSTEM_PROMPT = `You are a B2B lead-extraction engine for a European recruitment/outsourcing business.
Given raw, messy search-result or web-page text, identify ONE company that is a plausible business lead
(a company that could be a client, partner, or recruitment lead in Europe or the Middle East).

Return ONLY valid JSON, no markdown fences, no preamble, matching this exact shape:
{
  "company_name": string,
  "country": string,
  "sector": string,
  "evidence": string,        // a short quote/snippet (max 250 chars) from the text that justifies this lead
  "contact_email": string|null,
  "contact_website": string|null,
  "confidence": "high"|"medium"|"low",
  "score": number            // 0-100 lead quality score
}

Scoring guidance:
- score 80-100: clear hiring/expansion signal, direct contact info present, strong sector match
- score 50-79: relevant company, some signal, missing direct contact
- score 0-49: weak/ambiguous signal, generic mention only

confidence guidance:
- "high": explicit company name + clear business signal + contact info found
- "medium": company identified but evidence or contact info is partial
- "low": speculative match, sparse evidence

If no plausible lead can be extracted, return:
{"company_name": null}`

export async function extractLeadFromText(rawText: string): Promise<ExtractedLead | null> {
  const groq = getClient()

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Raw search result text:\n\n${rawText}\n\nExtract the lead as JSON.`,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) return null

  const cleaned = raw.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (!parsed.company_name) return null
    return parsed as ExtractedLead
  } catch {
    return null
  }
}
