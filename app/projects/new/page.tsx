import { ProjectForm } from "@/app/projects/project-form";
import { AppShell } from "@/components/app-shell";
import { BackLink, PageHeader } from "@/components/dashboard/ui";
import { requireManager } from "@/lib/auth";
import { listAssignableHeads } from "@/lib/work/queries";

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
      <BackLink href="/projects">Back to projects</BackLink>
      <PageHeader
        icon="/projects"
        caption="Manager"
        title="New project"
        description="Set the dates, budget and project head"
      />
      <ProjectForm heads={heads} error={error} />
    </AppShell>
  );
}
