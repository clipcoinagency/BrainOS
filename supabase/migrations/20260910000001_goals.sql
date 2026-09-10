-- ===========================================================================
-- 0004 · Goals
-- ===========================================================================
-- Same pattern as the notes/tasks migrations: RLS enabled immediately,
-- policies scoped to the owner via auth.uid(), an updated_at trigger, cascade
-- delete from auth.users. Progress is a plain current/target pair in
-- `double precision` (maps cleanly to a JS number) so a goal can be
-- "8 of 24 books" or "1500.5 of 5000 dollars" — display derives the percent.
-- ===========================================================================

create table if not exists public.goals (
  id            uuid             primary key default gen_random_uuid(),
  user_id       uuid             not null references auth.users (id) on delete cascade,
  title         text             not null,
  description   text             not null default '',
  status        text             not null default 'active'
                                   check (status in ('active', 'achieved', 'archived')),
  target_value  double precision not null default 100 check (target_value > 0),
  current_value double precision not null default 0 check (current_value >= 0),
  unit          text             not null default '',
  target_date   date,
  created_at    timestamptz      not null default now(),
  updated_at    timestamptz      not null default now()
);

comment on table public.goals is 'User-authored goals with current/target progress.';

-- Fast owner-scoped listing: active goals first, soonest target date first.
create index if not exists goals_user_sort_idx
  on public.goals (user_id, status, target_date);

-- --- Row Level Security -----------------------------------------------------
alter table public.goals enable row level security;

create policy "Goals are viewable by their owner"
  on public.goals for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own goals"
  on public.goals for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own goals"
  on public.goals for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own goals"
  on public.goals for delete
  using ((select auth.uid()) = user_id);

-- --- updated_at maintenance -------------------------------------------------
-- Reuses public.handle_updated_at(), defined in 0001_init.sql.
create trigger goals_set_updated_at
  before update on public.goals
  for each row
  execute function public.handle_updated_at();
