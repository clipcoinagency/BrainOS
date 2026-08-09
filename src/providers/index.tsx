"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

/**
 * Composes every client-side provider into a single component so the root
 * layout stays clean. Order matters: theme is outermost so everything can read
 * it; data and UI providers sit inside.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster position="bottom-right" richColors />
      </QueryProvider>
    </ThemeProvider>
  );
}
