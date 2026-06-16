# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

EuroLeads — an AI-powered lead-intelligence app for European/Middle-East B2B and recruitment outreach. Next.js 14 (App Router) + TypeScript + Tailwind, with Supabase for auth/data and the Groq API for extracting structured leads from raw search-result text. Lead *sourcing* and *email sending* are not done in this app — they're delegated to an external n8n instance that this app triggers via webhooks and receives callbacks from.

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint
```

There is no test suite configured in this repo currently.

## Environment

Copy `.env.local.example` to `.env.local`. Key variables:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`, `GROQ_MODEL` (defaults to `llama-3.3-70b-versatile` if unset)
- `N8N_SEARCH_WEBHOOK_URL`, `N8N_SEND_EMAIL_WEBHOOK_URL` — outbound, app → n8n
- `WEBHOOK_SHARED_SECRET` — n8n must echo this in the `x-webhook-secret` header when calling `/api/webhook/reply`
- `NEXT_PUBLIC_APP_URL` — used to build the callback URL passed to n8n

DB schema lives in `supabase/schema.sql` (not migrations — run manually in the Supabase SQL editor). It defines `users`, `leads`, `email_logs`, `settings` (single row, `id = 'default'`), all RLS-protected, plus a `brochures` public storage bucket created separately.

## Architecture

**Two Supabase access patterns, used deliberately depending on caller identity:**
- `getSupabaseRouteClient()` / `getSupabaseServerClient()` (`lib/supabase-server.ts`) — cookie-bound, respects RLS, used for anything triggered by a logged-in user (the `leads` CRUD routes, `email/send`).
- `getSupabaseServiceClient()` — service-role key, bypasses RLS, used only for server-to-server paths with no user session: `/api/extract`, `/api/leads/dedupe` (called by n8n), and `/api/webhook/reply` (called by n8n, secret-gated). Never import this into client components.
- `lib/supabase-browser.ts` provides the client-side Supabase client (`'use client'`) for use in components.

Auth/route protection is centralized in `middleware.ts`: `/dashboard`, `/leads`, `/settings` require a session (redirect to `/login`); `/login` redirects away if already authenticated. Don't duplicate auth checks inside individual pages/routes — middleware is the gate.

**Lead extraction (`lib/groq.ts`):** a single function, `extractLeadFromText`, wraps a Groq chat-completions call (JSON mode via `response_format: { type: 'json_object' }`) with a fixed system prompt that forces strict JSON output (company_name/country/sector/evidence/contact_email/contact_website/confidence/score 0-100). Returns `null` if the model reports no plausible lead or the JSON fails to parse — callers must handle that as a normal, non-error outcome, not throw.

**Dedup strategy:** leads are deduped by `normalizeCompanyKey(company_name, country)` (`lib/utils.ts` — lowercased, trimmed `name__country`), computed in-memory against all existing leads fetched from Supabase. This happens in both `/api/extract` (single) and `/api/leads/dedupe` (batch) — keep the two in sync if the dedup logic changes; there's no shared DB-level uniqueness constraint enforcing it (only a non-unique index on `lower(company_name), lower(country)`).

**The n8n integration boundary** is the core design point of this app — see the table in `README.md`. App-originated triggers (`/api/leads/search-trigger`, lead-row "Email" button → `/api/email/send`) POST to n8n webhook URLs and return once n8n accepts the job; n8n does the actual work (web search, SMTP send) asynchronously and calls back into this app's `/api/extract`, `/api/leads/dedupe`, or `/api/webhook/reply`. When changing payload shapes on either side of these boundaries, both this repo and the n8n workflow need to stay in sync — there's no shared schema.

**Lead pipeline stages** are a fixed, ordered enum (`types/index.ts`: `STAGES` = New → Contacted → Replied → Call Set → Proposal → Partner), enforced both in the TS type and as a Postgres `check` constraint in `schema.sql`. Stage-advancement logic lives in the route handlers, not centrally: `/api/email/send` moves `New` → `Contacted`; `/api/webhook/reply` moves to `Replied` unless the lead is already at `Call Set`/`Proposal`/`Partner` (won't regress an advanced deal). Keep that "don't regress" rule in mind if adding more automatic stage transitions.

**Settings is a singleton row** (`settings` table, `id = 'default'`) holding target countries/sectors, brochure URL, and email subject/body templates — not a per-user settings table. `/api/email/send` falls back to hardcoded default templates if no settings row exists yet.

## Known repo quirk

There's a stray empty directory tree at `app/{login,dashboard,leads,settings,api/{leads,extract,webhook/reply,email}}` — leftover from a `mkdir` brace-expansion that ran in a shell without brace-expansion support. It's inert (no files inside) but don't be confused by it when listing `app/`; the real routes are the normal subdirectories (`app/login`, `app/dashboard`, `app/leads`, `app/settings`, `app/api/...`).
