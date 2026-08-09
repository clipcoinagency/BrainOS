import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

/**
 * Global 404. Rendered inside the root layout (outside the app shell).
 */
export default function NotFound() {
  return (
    <div className="bg-grid-glow flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo iconOnly className="mb-6 scale-125" />
      <p className="text-brand text-sm font-medium">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm text-pretty">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </Button>
    </div>
  );
}
