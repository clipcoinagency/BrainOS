import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectEditor, MilestoneList } from "@/features/projects";
import { getProject, listMilestones } from "@/features/projects/queries";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return { title: "Project not found" };
  return { title: project.title.trim() || "Untitled project" };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  const milestones = await listMilestones(id);

  return (
    <div className="space-y-8">
      <ProjectEditor project={project} />
      <div className="mx-auto max-w-2xl">
        <MilestoneList projectId={id} initialMilestones={milestones} />
      </div>
    </div>
  );
}
