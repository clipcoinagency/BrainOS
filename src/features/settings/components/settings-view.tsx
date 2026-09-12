"use client";

import { useState, useTransition } from "react";
import { Check, LogOut, Loader2, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "@/features/auth/actions";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

import { useUpdateProfile } from "../hooks/use-settings";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function SettingsView({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Settings"
        description="Preferences, appearance, and account."
      />
      <ProfileCard profile={profile} email={email} />
      <AppearanceCard />
      <AccountCard email={email} />
    </div>
  );
}

function ProfileCard({ profile, email }: { profile: Profile; email: string }) {
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState(profile.full_name ?? "");

  const trimmed = fullName.trim();
  const dirty = trimmed !== (profile.full_name ?? "").trim();

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed || !dirty) return;

    updateProfile.mutate(
      { fullName: trimmed },
      {
        onSuccess: (result) => {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          toast.success("Profile updated.");
        },
        onError: () => toast.error("Failed to update your profile."),
      },
    );
  }

  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your name is shown across BrainOS, including the sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-full-name">Full name</Label>
            <Input
              id="settings-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" value={email} disabled readOnly />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            disabled={!trimmed || !dirty || updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  // Avoids a hydration mismatch: the server has no notion of the visitor's
  // stored theme preference, so `theme` is only trustworthy once mounted.
  const mounted = useMounted();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Choose how BrainOS looks on this device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div role="radiogroup" aria-label="Theme" className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const selected = mounted && theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(value)}
                className={cn(
                  "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors focus-visible:ring-3 focus-visible:outline-none",
                  selected
                    ? "border-brand bg-brand/5 text-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                {label}
                {selected ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  <span className="size-3.5" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AccountCard({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>{email}</CardDescription>
      </CardHeader>
      <CardFooter className="justify-end">
        <Button
          variant="destructive"
          disabled={isPending}
          onClick={handleSignOut}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Sign out
        </Button>
      </CardFooter>
    </Card>
  );
}
