"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CreditCard, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/actions";

export interface ShellUser {
  name: string;
  email: string;
  initials: string;
}

interface UserMenuProps {
  user: ShellUser;
  /** True when a real Supabase session is present (vs. guest mode). */
  authenticated: boolean;
}

/**
 * Account dropdown. When authenticated, "Sign out" runs the server action;
 * otherwise the menu reflects guest mode.
 */
export function UserMenu({ user, authenticated }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    if (!authenticated) {
      toast("Authentication is not configured yet");
      return;
    }
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative size-9 rounded-full p-0"
          aria-label="Open account menu"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-brand/15 text-brand text-xs font-medium">
              {user.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-muted-foreground text-xs font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast("Billing — coming soon")}>
            <CreditCard className="size-4" />
            Billing
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
