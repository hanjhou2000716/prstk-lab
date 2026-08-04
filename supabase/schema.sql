-- PRStK Lab E05: user-owned research projects.
-- Run this in Supabase SQL Editor before enabling the sync controls.
create table if not exists public.research_projects (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id)
);

alter table public.research_projects enable row level security;

drop policy if exists "research_projects_select_own" on public.research_projects;
create policy "research_projects_select_own" on public.research_projects
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "research_projects_insert_own" on public.research_projects;
create policy "research_projects_insert_own" on public.research_projects
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "research_projects_update_own" on public.research_projects;
create policy "research_projects_update_own" on public.research_projects
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "research_projects_delete_own" on public.research_projects;
create policy "research_projects_delete_own" on public.research_projects
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.research_projects to authenticated;
