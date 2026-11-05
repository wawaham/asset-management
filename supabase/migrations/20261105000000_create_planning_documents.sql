create table if not exists public.planning_documents (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('home_budget', 'wedding_guests')),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision integer not null default 1 check (revision > 0),
  primary key (user_id, kind)
);

alter table public.planning_documents enable row level security;
revoke all on public.planning_documents from anon, authenticated;
grant select, insert, update on public.planning_documents to authenticated;

drop policy if exists "Own planning documents" on public.planning_documents;
create policy "Own planning documents" on public.planning_documents
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
