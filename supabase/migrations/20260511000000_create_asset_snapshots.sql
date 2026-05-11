create table if not exists public.asset_snapshots (
  month text primary key,
  rows jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.asset_snapshots enable row level security;

drop policy if exists "Allow anon read asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow anon upsert asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow anon update asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow authenticated read asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow authenticated insert asset snapshots" on public.asset_snapshots;
drop policy if exists "Allow authenticated update asset snapshots" on public.asset_snapshots;

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
