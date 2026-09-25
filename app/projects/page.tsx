import { AppShell } from "@/components/app-shell";
import { PageHeader, SectionHeader } from "@/components/dashboard/ui";
import { NavIcon } from "@/components/nav-icon";
import { PageFallback } from "@/components/page-fallback";
import { ProjectCard } from "@/components/project-card";
import { SearchList } from "@/components/search-list";
import {
  EMPTY_PROJECTS,
  EMPTY_PROJECTS_HINT,
} from "@/lib/dashboards/empty-copy";
import { requireManagerOrHead } from "@/lib/auth";
import { listProjects } from "@/lib/work/queries";
import Link from "next/link";
import { Suspense } from "react";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const profile = await requireManagerOrHead();
  const isManager = profile.role === "manager";
  const deleted = (await searchParams).deleted === "1";

  return (
    <AppShell profile={profile}>
      <PageHeader
        icon="/projects"
        caption={isManager ? "Manager" : "Project head"}
        title="Projects"
        description={isManager ? "Projects you own" : "Projects you lead"}
        actions={
          isManager ? (
            <Link href="/projects/new" className="btn-primary gap-2">
              <NavIcon href="plus" />
              New project
            </Link>
          ) : null
        }
      />

      {deleted ? (
        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink">
          Project deleted.
        </p>
      ) : null}

      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeader icon="/projects" title="All projects" description="Search by title, head or deadline" />
        <Suspense fallback={<PageFallback />}>
          <ProjectsList />
        </Suspense>
      </section>
    </AppShell>
  );
}

async function ProjectsList() {
  const projects = await listProjects();
  return (
    <SearchList
      placeholder="Search projects"
      emptyTitle={EMPTY_PROJECTS}
      emptyHint={EMPTY_PROJECTS_HINT}
      items={projects.map((project) => ({
        key: String(project.id),
        haystack: `${project.title} ${project.head_name ?? ""} ${project.deadline}`,
        node: (
          <li key={project.id}>
            <ProjectCard project={project} />
          </li>
        ),
      }))}
    />
  );
}
