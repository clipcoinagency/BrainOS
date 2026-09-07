-- ===========================================================================
-- 0003 · Tasks
-- ===========================================================================
-- Same pattern as 0002_notes.sql: RLS enabled immediately, policies scoped to
-- the owner via auth.uid(), an updated_at trigger, cascade delete from
-- auth.users. Priority is a checked text column rather than a native enum —
-- easier to extend later without an ALTER TYPE migration.
-- ===========================================================================

create table if not exists public.tasks (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  title        text        not null,
  description  text        not null default '',
  priority     text        not null default 'none'
                             check (priority in ('none', 'low', 'medium', 'high')),
  due_date     date,
  is_completed boolean     not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.tasks is 'User-authored to-do items.';

-- Fast owner-scoped listing: open tasks first, soonest due date first.
create index if not exists tasks_user_sort_idx
  on public.tasks (user_id, is_completed, due_date);

-- --- Row Level Security -----------------------------------------------------
alter table public.tasks enable row level security;

create policy "Tasks are viewable by their owner"
  on public.tasks for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using ((select auth.uid()) = user_id);

-- --- updated_at maintenance -------------------------------------------------
-- Reuses public.handle_updated_at(), defined in 0001_init.sql.
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();
