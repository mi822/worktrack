import { ProjectForm } from "@/app/projects/project-form";
import { AppShell } from "@/components/app-shell";
import { requireManager } from "@/lib/auth";
import { parseIdParam } from "@/lib/work/parse";
import { getProject, listAssignableHeads } from "@/lib/work/queries";
import Link from "next/link";
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
      <p className="field-caption">Manager</p>
      <h1 className="page-title mt-1">Edit project</h1>
      <p className="mt-2 text-sm text-muted">{project.title}</p>
      <p className="mt-4 text-sm">
        <Link
          href={`/projects/${project.id}`}
          className="text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Back to project
        </Link>
      </p>
      <ProjectForm project={project} heads={heads} error={error} />
    </AppShell>
  );
}
