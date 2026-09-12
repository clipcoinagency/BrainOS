-- ===========================================================================
-- 0006 · Lock project_milestones.project_id after insert
-- ===========================================================================
-- Adversarial review of 0005_projects.sql found a gap: the UPDATE policy on
-- project_milestones only checks `auth.uid() = user_id` — it never checks
-- project_id. createMilestone() (src/features/projects/actions.ts) verifies
-- project_id ownership, but only at INSERT time. Nothing stopped a signed-in
-- user from later calling the Supabase REST API directly and repointing
-- their own milestone's project_id at a project they don't own; RLS would
-- allow it because the row's user_id is unchanged. Since this app never
-- legitimately moves a milestone between projects, the fix is to make
-- project_id immutable after insert — simpler and more robust than turning
-- the UPDATE policy into a join/EXISTS check against `projects`, and it
-- keeps every table's RLS policy shape identical.
-- ===========================================================================

create or replace function public.prevent_milestone_reparenting()
returns trigger
language plpgsql
as $$
begin
  if new.project_id is distinct from old.project_id then
    raise exception 'project_milestones.project_id cannot be changed after creation';
  end if;
  return new;
end;
$$;

create trigger project_milestones_lock_project_id
  before update on public.project_milestones
  for each row
  execute function public.prevent_milestone_reparenting();
