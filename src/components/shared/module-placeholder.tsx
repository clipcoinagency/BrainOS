import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { allModules, secondaryNavigation } from "@/config/navigation";

const lookup = [...allModules, ...secondaryNavigation];

interface ModulePlaceholderProps {
  /** The route of the module to render, e.g. "/notes". */
  href: string;
}

/**
 * A shared "coming soon" screen for modules that are routable but not yet
 * implemented. Metadata (title, description, icon) is read from the central
 * navigation config so a single edit updates the sidebar and this screen.
 */
export function ModulePlaceholder({ href }: ModulePlaceholderProps) {
  const moduleItem = lookup.find((item) => item.href === href);

  if (!moduleItem) {
    return (
      <ModuleShell
        title="Module"
        description="This module has not been registered in the navigation config."
      >
        <EmptyState
          icon={Hammer}
          title="Not configured"
          description={`No module is registered for "${href}".`}
        />
      </ModuleShell>
    );
  }

  const { title, description, icon: Icon } = moduleItem;

  return (
    <ModuleShell
      title={title}
      description={description}
      badge={<Badge variant="secondary">Planned</Badge>}
    >
      <EmptyState
        icon={Icon}
        title={`${title} is coming soon`}
        description="This module is part of the BrainOS roadmap. The foundation, routing, and navigation are ready — functionality will land here next."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        }
      />
    </ModuleShell>
  );
}

function ModuleShell({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={badge} />
      {children}
    </div>
  );
}
