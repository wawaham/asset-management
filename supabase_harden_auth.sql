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


create table if not exists public.asset_snapshot_versions (
  id bigint generated always as identity primary key,
  month text not null,
  operation text not null check (operation in ('baseline', 'insert', 'update', 'delete')),
  previous_rows jsonb,
  rows jsonb,
  previous_total numeric,
  total numeric,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

alter table public.asset_snapshot_versions enable row level security;

drop policy if exists "Allow authenticated read asset snapshot versions" on public.asset_snapshot_versions;

create policy "Allow authenticated read asset snapshot versions"
on public.asset_snapshot_versions
for select
to authenticated
using (auth.uid() is not null);

grant select on public.asset_snapshot_versions to authenticated;

create or replace function public.log_asset_snapshot_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.asset_snapshot_versions (month, operation, rows, total, changed_by)
    values (new.month, 'insert', new.rows, new.total, auth.uid());
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.asset_snapshot_versions (
      month, operation, previous_rows, rows, previous_total, total, changed_by
    ) values (
      new.month, 'update', old.rows, new.rows, old.total, new.total, auth.uid()
    );
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.asset_snapshot_versions (month, operation, previous_rows, previous_total, changed_by)
    values (old.month, 'delete', old.rows, old.total, auth.uid());
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists asset_snapshots_version_trigger on public.asset_snapshots;

create trigger asset_snapshots_version_trigger
after insert or update or delete on public.asset_snapshots
for each row execute function public.log_asset_snapshot_version();

insert into public.asset_snapshot_versions (month, operation, rows, total, changed_at)
select snapshot.month, 'baseline', snapshot.rows, snapshot.total, snapshot.updated_at
from public.asset_snapshots as snapshot
where not exists (
  select 1
  from public.asset_snapshot_versions as version
  where version.month = snapshot.month
    and version.operation = 'baseline'
);
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
  is_pinned boolean not null default false,
  author_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.real_estate_tips
  add column if not exists is_pinned boolean not null default false;

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

create table if not exists public.real_estate_visits (
  id bigint generated always as identity primary key,
  apartment_name text not null,
  address text,
  visit_date date,
  purpose text not null default '실거주',
  score numeric not null default 3,
  map_url text,
  lat numeric,
  lng numeric,
  summary text,
  photos jsonb not null default '[]'::jsonb,
  sections jsonb not null default '{}'::jsonb,
  author_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.real_estate_visits
  add column if not exists address text,
  add column if not exists visit_date date,
  add column if not exists purpose text not null default '실거주',
  add column if not exists score numeric not null default 3,
  add column if not exists map_url text,
  add column if not exists lat numeric,
  add column if not exists lng numeric,
  add column if not exists summary text,
  add column if not exists photos jsonb not null default '[]'::jsonb,
  add column if not exists sections jsonb not null default '{}'::jsonb,
  add column if not exists author_email text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.real_estate_visits enable row level security;

drop policy if exists "Allow authenticated read real estate visits" on public.real_estate_visits;
drop policy if exists "Allow authenticated insert real estate visits" on public.real_estate_visits;
drop policy if exists "Allow authenticated update real estate visits" on public.real_estate_visits;
drop policy if exists "Allow authenticated delete real estate visits" on public.real_estate_visits;

create policy "Allow authenticated read real estate visits"
on public.real_estate_visits
for select
to authenticated
using (auth.uid() is not null);

create policy "Allow authenticated insert real estate visits"
on public.real_estate_visits
for insert
to authenticated
with check (auth.uid() is not null);

create policy "Allow authenticated update real estate visits"
on public.real_estate_visits
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Allow authenticated delete real estate visits"
on public.real_estate_visits
for delete
to authenticated
using (auth.uid() is not null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tip-images',
  'tip-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'visit-images',
  'visit-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Allow public read tip images" on storage.objects;
drop policy if exists "Allow authenticated upload tip images" on storage.objects;
drop policy if exists "Allow authenticated update own tip images" on storage.objects;
drop policy if exists "Allow authenticated delete own tip images" on storage.objects;
drop policy if exists "Allow public read visit images" on storage.objects;
drop policy if exists "Allow authenticated upload visit images" on storage.objects;
drop policy if exists "Allow authenticated update own visit images" on storage.objects;
drop policy if exists "Allow authenticated delete own visit images" on storage.objects;

create policy "Allow public read tip images"
on storage.objects
for select
to public
using (bucket_id = 'tip-images');

create policy "Allow authenticated upload tip images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'tip-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Allow authenticated update own tip images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'tip-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'tip-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Allow authenticated delete own tip images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'tip-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Allow public read visit images"
on storage.objects
for select
to public
using (bucket_id = 'visit-images');

create policy "Allow authenticated upload visit images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'visit-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Allow authenticated update own visit images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'visit-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'visit-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Allow authenticated delete own visit images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'visit-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
