# Supabase

Database schema and setup for BrainOS.

## 1. Create a project

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL** and the **anon
   public** key.
3. Put them in `.env.local` at the repo root:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

Once these are set, the app enforces authentication (via `src/proxy.ts`) and
signed-out visitors are redirected to `/login`.

## 2. Apply the schema

Pick one of the following.

### Option A — Dashboard SQL editor (quickest)

Open **SQL Editor** in the Supabase dashboard, paste the contents of
[`migrations/20260808000001_init.sql`](migrations/20260808000001_init.sql), and
run it.

### Option B — Supabase CLI (recommended for teams)

```bash
# Install: https://supabase.com/docs/guides/local-development
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase db push        # applies everything in supabase/migrations
```

## 3. Configure auth

In **Authentication → URL Configuration**, add these redirect URLs:

- `http://localhost:3000/auth/callback` (development)
- `https://YOUR-DOMAIN/auth/callback` (production)

Email confirmation is on by default; sign-up then shows a "check your email"
message. Turn it off under **Authentication → Providers → Email** for faster
local testing.

## 4. Keep types in sync

The typed client uses `src/lib/supabase/types.ts`. After changing the schema,
regenerate it:

```bash
supabase gen types typescript --linked > ../src/lib/supabase/types.ts
```

Keep the `Database` export so the typed clients keep compiling.

## Conventions for new tables

Every module table should:

1. **Enable RLS** immediately: `alter table ... enable row level security;`
2. **Scope policies to the owner** with `(select auth.uid()) = user_id`.
3. Include `created_at` / `updated_at` and the `handle_updated_at` trigger.
4. Reference `auth.users(id)` (or `public.profiles(id)`) with
   `on delete cascade`.
