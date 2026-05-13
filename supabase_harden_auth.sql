drop policy if exists "Allow anon read asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow anon upsert asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow anon update asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow authenticated read asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow authenticated insert asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow authenticated update asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow authenticated delete asset snapshots" on public.asset_snapshots;

alter table public.asset_snapshots enable row level security;

create policy "Allow authenticated read asset snapshots"
on public.asset_snapshots
for select
to authenticated
using (auth.uid() is not null);

create policy "Allow authenticated insert asset snapshots"
on public.asset_snapshots
for insert
to authenticated
with check (auth.uid() is not null);

create policy "Allow authenticated update asset snapshots"
on public.asset_snapshots
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Allow authenticated delete asset snapshots"
on public.asset_snapshots
for delete
to authenticated
using (auth.uid() is not null);

create table if not exists public.asset_activity_logs (
  id bigint generated always as identity primary key,
  action text not null check (action in ('login', 'save', 'delete')),
  month text,
  total numeric not null default 0,
  user_id uuid,
  user_email text,
  client_context jsonb not null default '{}'::jsonb,
  location jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.asset_activity_logs
  alter column month drop not null,
  add column if not exists user_id uuid,
  add column if not exists client_context jsonb not null default '{}'::jsonb,
  add column if not exists location jsonb not null default '{}'::jsonb;

alter table public.asset_activity_logs
  drop constraint if exists asset_activity_logs_action_check,
  add constraint asset_activity_logs_action_check check (action in ('login', 'save', 'delete'));

alter table public.asset_activity_logs enable row level security;

drop policy if exists "Allow authenticated read asset activity logs" on public.asset_activity_logs;
drop policy if exists "Allow authenticated insert asset activity logs" on public.asset_activity_logs;

create policy "Allow authenticated read asset activity logs"
on public.asset_activity_logs
for select
to authenticated
using (auth.uid() is not null);

create policy "Allow authenticated insert asset activity logs"
on public.asset_activity_logs
for insert
to authenticated
with check (auth.uid() is not null);

create table if not exists public.real_estate_tips (
  id bigint generated always as identity primary key,
  title text not null,
  excerpt text,
  content text not null default '<p></p>',
  author_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.real_estate_tips enable row level security;

drop policy if exists "Allow authenticated read real estate tips" on public.real_estate_tips;
drop policy if exists "Allow authenticated insert real estate tips" on public.real_estate_tips;
drop policy if exists "Allow authenticated update real estate tips" on public.real_estate_tips;
drop policy if exists "Allow authenticated delete real estate tips" on public.real_estate_tips;

create policy "Allow authenticated read real estate tips"
on public.real_estate_tips
for select
to authenticated
using (auth.uid() is not null);

create policy "Allow authenticated insert real estate tips"
on public.real_estate_tips
for insert
to authenticated
with check (auth.uid() is not null);

create policy "Allow authenticated update real estate tips"
on public.real_estate_tips
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Allow authenticated delete real estate tips"
on public.real_estate_tips
for delete
to authenticated
using (auth.uid() is not null);
