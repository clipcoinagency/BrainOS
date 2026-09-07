-- ===========================================================================
-- 0002 · Notes
-- ===========================================================================
-- The first workspace module. Follows the exact pattern established in
-- 0001_init.sql: RLS enabled immediately, policies scoped to the owner via
-- auth.uid(), an updated_at trigger, and a cascade delete from auth.users.
-- ===========================================================================

create table if not exists public.notes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  title       text        not null default '',
  content     text        not null default '',
  is_pinned   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.notes is 'User-authored notes.';

-- Fast owner-scoped listing, pinned-first, most-recently-updated-first.
create index if not exists notes_user_sort_idx
  on public.notes (user_id, is_pinned desc, updated_at desc);

-- --- Row Level Security -----------------------------------------------------
alter table public.notes enable row level security;

create policy "Notes are viewable by their owner"
  on public.notes for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using ((select auth.uid()) = user_id);

-- --- updated_at maintenance -------------------------------------------------
-- Reuses public.handle_updated_at(), defined in 0001_init.sql.
create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.handle_updated_at();
