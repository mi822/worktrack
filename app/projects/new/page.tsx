import { ProjectForm } from "@/app/projects/project-form";
import { AppShell } from "@/components/app-shell";
import { requireManager } from "@/lib/auth";
import { listAssignableHeads } from "@/lib/work/queries";
import Link from "next/link";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireManager();
  const heads = await listAssignableHeads();
  const params = await searchParams;
  const error = params.error?.trim() ? params.error : null;

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Manager</p>
      <h1 className="page-title mt-1">New project</h1>
      <p className="page-lede">
        Assign exactly one project head. The project stays visible to you and
        that head.
      </p>
      <p className="mt-4 text-sm">
        <Link href="/projects" className="text-muted underline-offset-2 hover:text-ink hover:underline">
          Back to projects
        </Link>
      </p>
      <ProjectForm heads={heads} error={error} />
    </AppShell>
  );
}
