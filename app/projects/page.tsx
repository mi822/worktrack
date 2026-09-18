import { AppShell } from "@/components/app-shell";
import { PageFallback } from "@/components/page-fallback";
import { SearchList } from "@/components/search-list";
import {
  EMPTY_PROJECTS,
  EMPTY_PROJECTS_HINT,
} from "@/lib/dashboards/empty-copy";
import { requireManagerOrHead } from "@/lib/auth";
import { formatDate } from "@/lib/format-date";
import { listProjects, progressCopy } from "@/lib/work/queries";
import { PROJECT_STATUS_LABEL } from "@/lib/work/types";
import Link from "next/link";
import { Suspense } from "react";

export default async function ProjectsPage() {
  const profile = await requireManagerOrHead();
  const isManager = profile.role === "manager";

  return (
    <AppShell profile={profile}>
      <p className="field-caption">{isManager ? "Manager" : "Project head"}</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Projects</h1>
        </div>
        {isManager ? (
          <Link href="/projects/new" className="btn-primary">
            New project
          </Link>
        ) : null}
      </div>

      <section className="panel mt-8 p-6">
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
          <li key={project.id} className="py-4 first:pt-0 last:pb-0">
            <Link
              href={`/projects/${project.id}`}
              className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-action/20"
            >
              <p className="text-sm font-semibold text-ink">{project.title}</p>
              <p className="mt-1 text-sm text-muted">
                {PROJECT_STATUS_LABEL[project.status]}
                {" · Deadline "}
                {formatDate(project.deadline)}
                {project.head_name ? ` · ${project.head_name}` : ""}
              </p>
              <p className="mt-1 text-sm text-muted">
                {progressCopy(project.progress)}
              </p>
            </Link>
          </li>
        ),
      }))}
    />
  );
}
