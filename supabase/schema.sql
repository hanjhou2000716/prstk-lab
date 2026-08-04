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

-- PRStK Lab H03: notification preferences and service-managed Telegram links.
create table if not exists public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade primary key,
  latest_research boolean not null default true,
  weekly_digest boolean not null default true,
  tool_status boolean not null default true,
  review_reminders boolean not null default true,
  platform_updates boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own" on public.notification_preferences
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own" on public.notification_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own" on public.notification_preferences
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update on public.notification_preferences to authenticated;

-- Chat IDs and one-time link tokens are only managed by Edge Functions with the service role.
create table if not exists public.telegram_subscriptions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  telegram_chat_id text not null unique,
  linked_at timestamptz not null default timezone('utc', now()),
  last_delivery_at timestamptz,
  constraint telegram_chat_id_format check (telegram_chat_id ~ '^-?[0-9]{5,20}$')
);

alter table public.telegram_subscriptions enable row level security;
revoke all on public.telegram_subscriptions from anon, authenticated;

create table if not exists public.telegram_link_tokens (
  token_hash text not null primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.telegram_link_tokens enable row level security;
revoke all on public.telegram_link_tokens from anon, authenticated;
