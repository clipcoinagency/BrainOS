"use client";

import { CreditCard, LogOut, Settings, User } from "lucide-react";
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

// Placeholder identity until authentication is wired up.
const demoUser = {
  name: "Guest",
  email: "guest@brainos.local",
  initials: "G",
};

/**
 * Account dropdown. Actions are placeholders (auth is not implemented in the
 * foundation) and surface a toast so the shell feels alive.
 */
export function UserMenu() {
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
              {demoUser.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{demoUser.name}</span>
          <span className="text-muted-foreground text-xs font-normal">
            {demoUser.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => toast("Profile — coming soon")}>
            <User className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast("Settings — coming soon")}>
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast("Billing — coming soon")}>
            <CreditCard className="size-4" />
            Billing
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => toast("Authentication is not configured yet")}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
