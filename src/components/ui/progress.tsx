import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentProps<"div"> {
  /** 0–100. Values outside the range are clamped. */
  value?: number;
}

/**
 * A determinate progress bar. Not a Radix wrapper — a plain, correctly
 * labelled `role="progressbar"` element is enough for a determinate bar, and
 * it keeps the component dependency-free.
 */
function Progress({ className, value = 0, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn(
        "bg-muted relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="bg-brand h-full rounded-full transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
