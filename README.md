# EuroLeads

AI-powered lead intelligence app for European/Middle-East B2B and recruitment outreach. Next.js 14 (App Router) + TypeScript + Tailwind + Supabase + Groq API, with n8n handling search and email automation externally.

## Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Auth/DB**: Supabase (Postgres + Auth + Storage)
- **AI**: Groq API (lead extraction & scoring, Llama 3.3 70B)
- **Automation**: n8n (external, triggered via webhooks)
- **Deploy**: Vercel

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project**, then run `supabase/schema.sql` in the SQL Editor to create the `users`, `leads`, `email_logs`, and `settings` tables with RLS policies.

3. **Create a Storage bucket** named `brochures` (public) in Supabase Storage for brochure PDFs.

4. **Copy environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Project Settings → API
   - `GROQ_API_KEY` — from console.groq.com
   - `N8N_SEARCH_WEBHOOK_URL` / `N8N_SEND_EMAIL_WEBHOOK_URL` — your n8n webhook trigger URLs
   - `WEBHOOK_SHARED_SECRET` — any long random string; n8n must echo this in the `x-webhook-secret` header when calling `/api/webhook/reply`

5. **Run locally**
   ```bash
   npm run dev
   ```

6. **Deploy to Vercel** — push to GitHub, import into Vercel, add the same env vars in Project Settings → Environment Variables.

## n8n Integration Points

| Direction | Endpoint | Purpose |
|---|---|---|
| App → n8n | `N8N_SEARCH_WEBHOOK_URL` | Triggered by "Trigger n8n search now" in Settings; n8n runs search, then posts results back to `/api/leads/dedupe` or `/api/extract` |
| App → n8n | `N8N_SEND_EMAIL_WEBHOOK_URL` | Triggered by the "Email" button on a lead; n8n sends the templated email + brochure PDF via SMTP |
| n8n → App | `POST /api/extract` | n8n posts raw search-result text (`{ rawText, sourceUrl }`); Groq extracts a structured lead, deduped, inserted |
| n8n → App | `POST /api/leads/dedupe` | Batch version of `/api/extract` for multiple results (`{ items: [{ rawText, sourceUrl }] }`) |
| n8n → App | `POST /api/webhook/reply` | n8n posts when a reply email is detected (`{ leadId or fromEmail, subject, body }`), requires `x-webhook-secret` header |

## Project Structure

```
app/
  login/                 Login/Signup page
  dashboard/             Stat cards + pipeline strip
  leads/                 Filterable leads table
  leads/[id]/            Lead detail page
  settings/              Targeting, brochure, email templates
  api/
    extract/             Groq extraction + dedupe (single)
    leads/dedupe/         Groq extraction + dedupe (batch)
    leads/                Leads CRUD
    leads/search-trigger/ Forwards to n8n search webhook
    email/send/           Forwards to n8n send-email webhook, logs to email_logs
    webhook/reply/         Inbound webhook from n8n for reply detection
components/              All UI components
lib/                      Supabase clients, Groq client, utils
types/                     Shared TypeScript types
supabase/schema.sql        Full DB schema with RLS policies
```
