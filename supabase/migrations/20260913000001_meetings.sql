-- ===========================================================================
-- 0011 · Meetings
-- ===========================================================================
-- Same pattern as every prior table: RLS enabled immediately, policies
-- scoped to the owner via auth.uid(), an updated_at trigger, cascade delete
-- from auth.users. `scheduled_at` is a nullable timestamptz (unlike the
-- date-only columns elsewhere) since a meeting has a specific time of day,
-- not just a day.
-- ===========================================================================

create table if not exists public.meetings (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  title        text        not null default '',
  scheduled_at timestamptz,
  attendees    text        not null default '',
  notes        text        not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.meetings is 'User-authored meeting records: schedule, attendees, agenda/notes.';

create index if not exists meetings_user_sort_idx
  on public.meetings (user_id, scheduled_at);

-- --- Row Level Security -----------------------------------------------------
alter table public.meetings enable row level security;

create policy "Meetings are viewable by their owner"
  on public.meetings for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own meetings"
  on public.meetings for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own meetings"
  on public.meetings for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own meetings"
  on public.meetings for delete
  using ((select auth.uid()) = user_id);

-- --- updated_at maintenance -------------------------------------------------
create trigger meetings_set_updated_at
  before update on public.meetings
  for each row
  execute function public.handle_updated_at();
