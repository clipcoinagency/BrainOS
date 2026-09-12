-- ===========================================================================
-- 0005 · Projects
-- ===========================================================================
-- Same pattern as the notes/tasks/goals migrations: RLS enabled immediately,
-- an updated_at trigger, cascade delete from auth.users. Two tables this
-- time — projects and their milestones — but project_milestones carries its
-- OWN `user_id` (denormalized from its parent project) rather than being
-- scoped via a join/EXISTS policy against `projects`. This keeps every
-- table's RLS policy identical (`auth.uid() = user_id`) and lets the
-- application layer keep using the same "filter by id AND user_id" pattern
-- everywhere. The app layer is still responsible for verifying a milestone's
-- project_id actually belongs to the caller before insert — see
-- src/features/projects/actions.ts's createMilestone.
-- ===========================================================================

create table if not exists public.projects (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  title        text        not null,
  description  text        not null default '',
  status       text        not null default 'active'
                             check (status in ('active', 'completed', 'archived')),
  target_date  date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.projects is 'User-authored projects that group milestones.';

create table if not exists public.project_milestones (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null references public.projects (id) on delete cascade,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  title        text        not null,
  is_completed boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.project_milestones is 'Checklist items within a project.';

-- Fast owner-scoped listing.
create index if not exists projects_user_sort_idx
  on public.projects (user_id, status, target_date);

-- Fast per-project milestone listing (append order).
create index if not exists project_milestones_project_idx
  on public.project_milestones (project_id, created_at);

-- Fast "all of this user's milestones" rollup, used to compute each
-- project's progress in one extra query instead of one per project.
create index if not exists project_milestones_user_idx
  on public.project_milestones (user_id);

-- --- Row Level Security -----------------------------------------------------
alter table public.projects enable row level security;
alter table public.project_milestones enable row level security;

create policy "Projects are viewable by their owner"
  on public.projects for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own projects"
  on public.projects for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using ((select auth.uid()) = user_id);

create policy "Milestones are viewable by their owner"
  on public.project_milestones for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own milestones"
  on public.project_milestones for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own milestones"
  on public.project_milestones for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own milestones"
  on public.project_milestones for delete
  using ((select auth.uid()) = user_id);

-- --- updated_at maintenance -------------------------------------------------
-- Reuses public.handle_updated_at(), defined in 0001_init.sql.
create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.handle_updated_at();

create trigger project_milestones_set_updated_at
  before update on public.project_milestones
  for each row
  execute function public.handle_updated_at();
