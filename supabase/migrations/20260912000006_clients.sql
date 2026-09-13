-- ===========================================================================
-- 0010 · Clients
-- ===========================================================================
-- Same pattern as every prior table: RLS enabled immediately, policies
-- scoped to the owner via auth.uid(), an updated_at trigger, cascade delete
-- from auth.users.
-- ===========================================================================

create table if not exists public.clients (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  name       text        not null,
  company    text        not null default '',
  email      text        not null default '',
  phone      text        not null default '',
  notes      text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clients is 'User-managed client/contact records.';

create index if not exists clients_user_sort_idx
  on public.clients (user_id, created_at);

-- --- Row Level Security -----------------------------------------------------
alter table public.clients enable row level security;

create policy "Clients are viewable by their owner"
  on public.clients for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own clients"
  on public.clients for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own clients"
  on public.clients for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own clients"
  on public.clients for delete
  using ((select auth.uid()) = user_id);

-- --- updated_at maintenance -------------------------------------------------
create trigger clients_set_updated_at
  before update on public.clients
  for each row
  execute function public.handle_updated_at();
