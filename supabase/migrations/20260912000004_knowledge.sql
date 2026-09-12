-- ===========================================================================
-- 0008 · Knowledge Base
-- ===========================================================================
-- Same pattern as every prior table: RLS enabled immediately, policies
-- scoped to the owner via auth.uid(), an updated_at trigger, cascade delete
-- from auth.users. Wiki-style linking ("[[Article Title]]" inside content,
-- resolved to backlinks by title match) is app-layer, not a schema feature —
-- there is no separate links table, since a link is just a title substring
-- inside `content` and the set of "articles linking to X" is computed with
-- an ILIKE query at read time (see `listBacklinks` in queries.ts).
-- ===========================================================================

create table if not exists public.knowledge_articles (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  title      text        not null default '',
  content    text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.knowledge_articles is 'User-authored wiki articles with [[title]]-style cross-links resolved at read time.';

-- Fast owner-scoped listing, most recently updated first.
create index if not exists knowledge_articles_user_sort_idx
  on public.knowledge_articles (user_id, updated_at desc);

-- --- Row Level Security -----------------------------------------------------
alter table public.knowledge_articles enable row level security;

create policy "Knowledge articles are viewable by their owner"
  on public.knowledge_articles for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own knowledge articles"
  on public.knowledge_articles for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own knowledge articles"
  on public.knowledge_articles for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own knowledge articles"
  on public.knowledge_articles for delete
  using ((select auth.uid()) = user_id);

-- --- updated_at maintenance -------------------------------------------------
-- Reuses public.handle_updated_at(), defined in 0001_init.sql.
create trigger knowledge_articles_set_updated_at
  before update on public.knowledge_articles
  for each row
  execute function public.handle_updated_at();
