"use server";

import { notifyUser } from "@/lib/notifications/queries";
import {
  requireManagerOrHead,
  requireProjectHead,
  requireTaskAccess,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseIdParam, parseTaskInput, workActionError } from "@/lib/work/parse";
import { canTransition } from "@/lib/work/task-transitions";
import type { TaskStatus } from "@/lib/work/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function refreshTask(taskId: number, projectId: number) {
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

async function assertCanReviewProject(projectId: number) {
  const profile = await requireManagerOrHead();
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, manager_id, project_head_id")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) {
    return { profile, ok: false as const };
  }

  const ok =
    (profile.role === "manager" && project.manager_id === profile.id) ||
    (profile.role === "project_head" && project.project_head_id === profile.id);

  return { profile, ok };
}

export async function createTask(formData: FormData) {
  const profile = await requireProjectHead();
  const projectId = parseIdParam(String(formData.get("project_id") ?? ""));
  if (!projectId) {
    fail("/projects", "That project was not found.");
  }

  const path = `/projects/${projectId}`;
  const parsed = parseTaskInput(formData);
  if (parsed.error) {
    fail(path, parsed.error);
  }

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, project_head_id, status")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.project_head_id !== profile.id) {
    fail(path, "You are not allowed to assign tasks on this project.");
  }
  if (project.status !== "active") {
    fail(path, "Tasks can only be added while the project is active.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      assignee_id: parsed.assignee_id,
      created_by: profile.id,
      description: parsed.description,
      priority: parsed.priority,
      deadline: parsed.deadline,
      status: "assigned",
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    fail(path, workActionError("Unable to create the task.", error?.message));
  }

  await notifyUser({
    recipientId: parsed.assignee_id,
    kind: "task_assigned",
    title: "New task assigned",
    body: parsed.description,
    href: `/tasks/${data.id}`,
  });

  refreshTask(Number(data.id), projectId);
  redirect(`/tasks/${data.id}`);
}

export async function startTask(formData: FormData) {
  const profile = await requireTaskAccess();
  const taskId = parseIdParam(String(formData.get("task_id") ?? ""));
  if (!taskId) {
    fail("/tasks", "That task was not found.");
  }

  const supabase = await createClient();
  const { data: current, error: loadError } = await supabase
    .from("tasks")
    .select("id, project_id, status, assignee_id")
    .eq("id", taskId)
    .maybeSingle();

  if (loadError || !current || current.assignee_id !== profile.id) {
    fail(`/tasks/${taskId}`, "That task was not found.");
  }

  const from = current.status as TaskStatus;
  if (!canTransition(from, "in_progress")) {
    fail(`/tasks/${taskId}`, "That status change is not allowed.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "in_progress" })
    .eq("id", taskId)
    .eq("assignee_id", profile.id)
    .in("status", ["assigned", "rejected"])
    .select("id, project_id")
    .maybeSingle();

  if (error || !data) {
    fail(
      `/tasks/${taskId}`,
      workActionError("Unable to start the task.", error?.message),
    );
  }

  refreshTask(taskId, Number(data.project_id));
  redirect(`/tasks/${taskId}`);
}

export async function submitTask(formData: FormData) {
  const profile = await requireTaskAccess();
  const taskId = parseIdParam(String(formData.get("task_id") ?? ""));
  if (!taskId) {
    fail("/tasks", "That task was not found.");
  }

  const notes = String(formData.get("notes") ?? "").trim();
  const supabase = await createClient();
  const { data: current, error: loadError } = await supabase
    .from("tasks")
    .select("id, project_id, status, assignee_id")
    .eq("id", taskId)
    .maybeSingle();

  if (loadError || !current || current.assignee_id !== profile.id) {
    fail(`/tasks/${taskId}`, "That task was not found.");
  }

  if (!canTransition(current.status as TaskStatus, "submitted")) {
    fail(`/tasks/${taskId}`, "That status change is not allowed.");
  }

  const { error: submitError } = await supabase.from("task_submissions").insert({
    task_id: taskId,
    submitted_by: profile.id,
    notes,
  });
  if (submitError) {
    fail(
      `/tasks/${taskId}`,
      workActionError("Unable to submit the task.", submitError.message),
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "submitted" })
    .eq("id", taskId)
    .eq("assignee_id", profile.id)
    .eq("status", "in_progress")
    .select("id, project_id")
    .maybeSingle();

  if (error || !data) {
    fail(
      `/tasks/${taskId}`,
      workActionError("Unable to submit the task.", error?.message),
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("project_head_id, manager_id")
    .eq("id", data.project_id)
    .maybeSingle();

  const reviewers = [
    project?.project_head_id,
    project?.manager_id,
  ].filter((id, index, all): id is string => Boolean(id) && all.indexOf(id) === index);

  await Promise.all(
    reviewers.map((recipientId) =>
      notifyUser({
        recipientId,
        kind: "task_submitted",
        title: "Task submitted",
        body: "A task is waiting for review.",
        href: `/tasks/${taskId}`,
      }),
    ),
  );

  refreshTask(taskId, Number(data.project_id));
  redirect(`/tasks/${taskId}`);
}

export async function startReviewTask(formData: FormData) {
  const taskId = parseIdParam(String(formData.get("task_id") ?? ""));
  if (!taskId) {
    fail("/projects", "That task was not found.");
  }

  const supabase = await createClient();
  const { data: current, error: loadError } = await supabase
    .from("tasks")
    .select("id, project_id, status")
    .eq("id", taskId)
    .maybeSingle();

  if (loadError || !current) {
    fail(`/tasks/${taskId}`, "That task was not found.");
  }

  const review = await assertCanReviewProject(Number(current.project_id));
  if (!review.ok) {
    fail(`/tasks/${taskId}`, "You are not allowed to review this task.");
  }

  if (!canTransition(current.status as TaskStatus, "under_review")) {
    fail(`/tasks/${taskId}`, "That status change is not allowed.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "under_review" })
    .eq("id", taskId)
    .eq("status", "submitted")
    .select("id, project_id")
    .maybeSingle();

  if (error || !data) {
    fail(
      `/tasks/${taskId}`,
      workActionError("Unable to start review.", error?.message),
    );
  }

  refreshTask(taskId, Number(data.project_id));
  redirect(`/tasks/${taskId}`);
}

export async function approveTask(formData: FormData) {
  const taskId = parseIdParam(String(formData.get("task_id") ?? ""));
  if (!taskId) {
    fail("/projects", "That task was not found.");
  }

  const supabase = await createClient();
  const { data: current, error: loadError } = await supabase
    .from("tasks")
    .select("id, project_id, status")
    .eq("id", taskId)
    .maybeSingle();

  if (loadError || !current) {
    fail(`/tasks/${taskId}`, "That task was not found.");
  }

  const review = await assertCanReviewProject(Number(current.project_id));
  if (!review.ok) {
    fail(`/tasks/${taskId}`, "You are not allowed to approve this task.");
  }

  if (!canTransition(current.status as TaskStatus, "approved")) {
    fail(`/tasks/${taskId}`, "That status change is not allowed.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "approved" })
    .eq("id", taskId)
    .in("status", ["submitted", "under_review"])
    .select("id, project_id, assignee_id, description")
    .maybeSingle();

  if (error || !data) {
    fail(
      `/tasks/${taskId}`,
      workActionError("Unable to approve the task.", error?.message),
    );
  }

  await notifyUser({
    recipientId: data.assignee_id,
    kind: "task_approved",
    title: "Task approved",
    body: data.description,
    href: `/tasks/${taskId}`,
  });

  refreshTask(taskId, Number(data.project_id));
  redirect(`/tasks/${taskId}`);
}

export async function rejectTask(formData: FormData) {
  const taskId = parseIdParam(String(formData.get("task_id") ?? ""));
  if (!taskId) {
    fail("/projects", "That task was not found.");
  }

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    fail(`/tasks/${taskId}`, "A reason is required to reject a task.");
  }

  const supabase = await createClient();
  const { data: current, error: loadError } = await supabase
    .from("tasks")
    .select("id, project_id, status, assignee_id, description")
    .eq("id", taskId)
    .maybeSingle();

  if (loadError || !current) {
    fail(`/tasks/${taskId}`, "That task was not found.");
  }

  const review = await assertCanReviewProject(Number(current.project_id));
  if (!review.ok) {
    fail(`/tasks/${taskId}`, "You are not allowed to reject this task.");
  }

  if (
    current.status !== "submitted" &&
    current.status !== "under_review"
  ) {
    fail(`/tasks/${taskId}`, "That status change is not allowed.");
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc("reject_task", {
    p_task_id: taskId,
    p_reason: reason,
  });

  const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  if (rpcError || !row?.ok) {
    fail(
      `/tasks/${taskId}`,
      workActionError(
        "Unable to reject the task.",
        (row?.code as string | undefined) ?? rpcError?.message,
      ),
    );
  }

  await notifyUser({
    recipientId: current.assignee_id,
    kind: "task_rejected",
    title: "Task rejected",
    body: reason,
    href: `/tasks/${taskId}`,
  });

  refreshTask(taskId, Number(current.project_id));
  redirect(`/tasks/${taskId}`);
}
