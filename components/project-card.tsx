import { IconTile, StatusPill } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/format-date";
import { progressCopy } from "@/lib/work/queries";
import {
  PROJECT_STATUS_LABEL,
  type ProjectListItem,
  type ProjectStatus,
} from "@/lib/work/types";
import Link from "next/link";

function statusTone(status: ProjectStatus) {
  if (status === "closed") {
    return "ok" as const;
  }
  if (status === "pending_closure") {
    return "warn" as const;
  }
  return "action" as const;
}

export function ProjectCard({
  project,
  showBudget = false,
}: {
  project: ProjectListItem;
  showBudget?: boolean;
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="card-row outline-none focus-visible:ring-2 focus-visible:ring-action/20"
    >
      <IconTile label={project.title} seed={project.id} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink">{project.title}</p>
          <StatusPill tone={statusTone(project.status)}>
            {PROJECT_STATUS_LABEL[project.status]}
          </StatusPill>
        </div>
        <p className="mt-1 text-sm text-muted">
          Deadline {formatDate(project.deadline)}
          {showBudget ? ` · Budget ${project.budget}` : ""}
          {project.head_name ? ` · ${project.head_name}` : ""}
        </p>
        <p className="mt-1 text-xs text-muted">{progressCopy(project.progress)}</p>
      </div>
    </Link>
  );
}
