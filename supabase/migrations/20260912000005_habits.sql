-- ===========================================================================
-- 0009 · Habits
-- ===========================================================================
-- Two-table feature, same shape as Projects/milestones: `habits` (the
-- routine itself) and `habit_logs` (one row per day it was done). A log's
-- `user_id` is denormalized (not derived via a join to `habits`) so every
-- table in the schema keeps the identical `auth.uid() = user_id` RLS policy
-- shape — the app layer verifies a log's `habit_id` actually belongs to the
-- caller before inserting it (see `logHabitCompletion` in actions.ts), the
-- same defense-in-depth pattern used for project_milestones.
-- ===========================================================================

create table if not exists public.habits (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  title       text        not null,
  description text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.habits is 'User-defined daily habits to track.';

create table if not exists public.habit_logs (
  id             uuid        primary key default gen_random_uuid(),
  habit_id       uuid        not null references public.habits (id) on delete cascade,
  user_id        uuid        not null references auth.users (id) on delete cascade,
  completed_date date        not null default current_date,
  created_at     timestamptz not null default now(),

  constraint habit_logs_one_per_day unique (habit_id, completed_date)
);

comment on table public.habit_logs is 'One row per day a habit was completed. No update path — only inserted (marking a day done) or deleted (un-marking it).';

-- Fast owner-scoped listing.
create index if not exists habits_user_sort_idx
  on public.habits (user_id, created_at);

create index if not exists habit_logs_habit_date_idx
  on public.habit_logs (habit_id, completed_date desc);

-- --- Row Level Security -----------------------------------------------------
alter table public.habits enable row level security;

create policy "Habits are viewable by their owner"
  on public.habits for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own habits"
  on public.habits for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own habits"
  on public.habits for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own habits"
  on public.habits for delete
  using ((select auth.uid()) = user_id);

alter table public.habit_logs enable row level security;

create policy "Habit logs are viewable by their owner"
  on public.habit_logs for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own habit logs"
  on public.habit_logs for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own habit logs"
  on public.habit_logs for delete
  using ((select auth.uid()) = user_id);

-- No update policy: habit_logs has no update path (see the table comment),
-- so there is nothing to lock down the way project_milestones.project_id
-- needed a trigger for.

-- --- updated_at maintenance -------------------------------------------------
-- Reuses public.handle_updated_at(), defined in 0001_init.sql.
create trigger habits_set_updated_at
  before update on public.habits
  for each row
  execute function public.handle_updated_at();
