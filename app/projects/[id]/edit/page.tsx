import { ProjectForm } from "@/app/projects/project-form";
import { AppShell } from "@/components/app-shell";
import { BackLink, PageHeader } from "@/components/dashboard/ui";
import { requireManager } from "@/lib/auth";
import { parseIdParam } from "@/lib/work/parse";
import { getProject, listAssignableHeads } from "@/lib/work/queries";
import { notFound, redirect } from "next/navigation";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireManager();
  const { id: rawId } = await params;
  const id = parseIdParam(rawId);
  if (!id) {
    notFound();
  }

  const [project, heads, query] = await Promise.all([
    getProject(id),
    listAssignableHeads(),
    searchParams,
  ]);
  if (!project) {
    notFound();
  }

  if (project.status === "closed") {
    redirect(`/projects/${project.id}?error=${encodeURIComponent("Closed projects cannot be edited.")}`);
  }

  const error = query.error?.trim() ? query.error : null;

  return (
    <AppShell profile={profile}>
      <BackLink href={`/projects/${project.id}`}>Back to project</BackLink>
      <PageHeader icon="/projects" caption="Edit project" title={project.title} />
      <ProjectForm project={project} heads={heads} error={error} />
    </AppShell>
  );
}
