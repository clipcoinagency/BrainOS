-- ===========================================================================
-- 0007 · Journal
-- ===========================================================================
-- Same pattern as every prior table: RLS enabled immediately, policies scoped
-- to the owner via auth.uid(), an updated_at trigger, cascade delete from
-- auth.users. One entry per user per calendar day, enforced by a unique
-- constraint on (user_id, entry_date) — `createJournalEntry` relies on this
-- to detect "today's entry already exists" via the constraint violation
-- rather than a separate check-then-insert (which would race).
-- ===========================================================================

create table if not exists public.journal_entries (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  entry_date date        not null default current_date,
  mood       text        check (mood in ('great', 'good', 'okay', 'low', 'rough')),
  content    text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint journal_entries_one_per_day unique (user_id, entry_date)
);

comment on table public.journal_entries is 'User-authored daily journal entries, at most one per calendar day.';

-- Fast owner-scoped listing, most recent day first.
create index if not exists journal_entries_user_date_idx
  on public.journal_entries (user_id, entry_date desc);

-- --- Row Level Security -----------------------------------------------------
alter table public.journal_entries enable row level security;

create policy "Journal entries are viewable by their owner"
  on public.journal_entries for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own journal entries"
  on public.journal_entries for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own journal entries"
  on public.journal_entries for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own journal entries"
  on public.journal_entries for delete
  using ((select auth.uid()) = user_id);

-- --- updated_at maintenance -------------------------------------------------
-- Reuses public.handle_updated_at(), defined in 0001_init.sql.
create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row
  execute function public.handle_updated_at();
