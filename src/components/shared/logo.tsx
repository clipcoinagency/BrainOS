import { Brain } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Hide the wordmark and render only the mark. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * The BrainOS logo: a gradient brain mark plus wordmark.
 * Uses currentColor-independent brand gradient so it reads in both themes.
 */
export function Logo({ iconOnly = false, className }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-brand text-brand-foreground flex size-8 items-center justify-center rounded-lg shadow-sm">
        <Brain className="size-5" aria-hidden />
      </span>
      {!iconOnly ? (
        <span className="text-[15px] leading-none font-semibold tracking-tight">
          {siteConfig.name}
        </span>
      ) : null}
      <span className="sr-only">{siteConfig.name}</span>
    </span>
  );
}
