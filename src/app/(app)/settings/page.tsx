import type { Metadata } from "next";
import { Database } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsView } from "@/features/settings";
import { getProfile, getUser } from "@/features/auth/queries";
import { isSupabaseConfigured } from "@/lib/env";
import type { Profile } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader
          title="Settings"
          description="Preferences, appearance, and account."
        />
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="flex items-start gap-3">
            <span className="bg-brand/15 text-brand flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Database className="size-5" />
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Connect your database</p>
              <p className="text-muted-foreground text-sm text-pretty">
                Profile settings are stored in Supabase. Add your{" "}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{" "}
                and{" "}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>{" "}
                to{" "}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  .env.local
                </code>
                . See{" "}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  supabase/README.md
                </code>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // `(app)/layout.tsx` already redirects to /login when Supabase is
  // configured and there's no session, so `user` is non-null here.
  const [user, fetchedProfile] = await Promise.all([getUser(), getProfile()]);
  const email = user?.email ?? "";

  // The `handle_new_user` trigger (supabase/migrations) creates a `profiles`
  // row for every new signup, so this should always find one — this
  // fallback only guards against that row not having landed yet.
  const profile: Profile = fetchedProfile ?? {
    id: user?.id ?? "",
    email,
    full_name:
      typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null,
    avatar_url: null,
    created_at: user?.created_at ?? new Date().toISOString(),
    updated_at: user?.created_at ?? new Date().toISOString(),
  };

  return <SettingsView profile={profile} email={email} />;
}
