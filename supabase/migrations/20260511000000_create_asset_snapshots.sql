create table if not exists public.asset_snapshots (
  month text primary key,
  rows jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.asset_snapshots enable row level security;

create policy "Allow anon read asset snapshots"
on public.asset_snapshots
for select
to anon
using (true);

create policy "Allow anon upsert asset snapshots"
on public.asset_snapshots
for insert
to anon
with check (true);

create policy "Allow anon update asset snapshots"
on public.asset_snapshots
for update
to anon
using (true)
with check (true);
