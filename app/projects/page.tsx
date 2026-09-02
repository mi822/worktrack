import { AppShell } from "@/components/app-shell";
import { requireManagerOrHead } from "@/lib/auth";
import { formatDate } from "@/lib/format-date";
import { listProjects, progressCopy } from "@/lib/work/queries";
import Link from "next/link";

export default async function ProjectsPage() {
  const profile = await requireManagerOrHead();
  const projects = await listProjects();
  const isManager = profile.role === "manager";

  return (
    <AppShell profile={profile}>
      <p className="field-caption">{isManager ? "Manager" : "Project head"}</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-lede">
            {isManager
              ? "Projects you own. Progress comes from that project’s tasks."
              : "Projects assigned to you. Create and review tasks here."}
          </p>
        </div>
        {isManager ? (
          <Link href="/projects/new" className="btn-primary">
            New project
          </Link>
        ) : null}
      </div>

      <section className="panel mt-8 p-6">
        {projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-8 text-center text-sm text-muted">
            No projects available.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {projects.map((project) => (
              <li key={project.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/projects/${project.id}`}
                  className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-mark/20"
                >
                  <p className="text-sm font-semibold text-ink">{project.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    Deadline {formatDate(project.deadline)}
                    {project.head_name ? ` · ${project.head_name}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {progressCopy(project.progress)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
