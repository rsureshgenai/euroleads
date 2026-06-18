-- EuroLeads Supabase schema
-- Run this in the Supabase SQL Editor for your project.

-- ── users ────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view own row" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own row" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own row" on public.users
  for insert with check (auth.uid() = id);

-- ── leads ────────────────────────────────────────────────
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  country text not null,
  sector text not null,
  evidence text not null default '',
  contact_email text,
  contact_website text,
  source_url text,
  confidence text not null default 'low' check (confidence in ('high', 'medium', 'low')),
  score int not null default 0 check (score >= 0 and score <= 100),
  stage text not null default 'New' check (
    stage in ('New', 'Contacted', 'Replied', 'Call Set', 'Proposal', 'Partner')
  ),
  last_activity timestamptz,
  notes text,
  roles_needed jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists leads_company_country_idx on public.leads (lower(company_name), lower(country));
create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

create policy "Authenticated users can view leads" on public.leads
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert leads" on public.leads
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update leads" on public.leads
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete leads" on public.leads
  for delete using (auth.role() = 'authenticated');

-- ── email_logs ───────────────────────────────────────────
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  direction text not null check (direction in ('sent', 'received')),
  subject text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists email_logs_lead_id_idx on public.email_logs (lead_id);

alter table public.email_logs enable row level security;

create policy "Authenticated users can view email logs" on public.email_logs
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert email logs" on public.email_logs
  for insert with check (auth.role() = 'authenticated');

-- ── settings (single row, id = 'default') ───────────────
create table if not exists public.settings (
  id text primary key default 'default',
  countries text[] not null default '{}',
  sectors text[] not null default '{}',
  brochure_url text,
  email_subject_template text,
  email_body_template text,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "Authenticated users can view settings" on public.settings
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can upsert settings" on public.settings
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update settings" on public.settings
  for update using (auth.role() = 'authenticated');

-- ── Storage bucket for brochures ────────────────────────
-- Run separately if needed (or create via Supabase Dashboard > Storage):
-- insert into storage.buckets (id, name, public) values ('brochures', 'brochures', true);

create policy "Public can read brochures" on storage.objects
  for select using (bucket_id = 'brochures');

create policy "Authenticated users can upload brochures" on storage.objects
  for insert with check (bucket_id = 'brochures' and auth.role() = 'authenticated');

create policy "Authenticated users can update brochures" on storage.objects
  for update using (bucket_id = 'brochures' and auth.role() = 'authenticated');

create policy "Authenticated users can delete brochures" on storage.objects
  for delete using (bucket_id = 'brochures' and auth.role() = 'authenticated');
