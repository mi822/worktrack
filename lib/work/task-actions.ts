"use server";

import { requireProjectHead, requireTaskAccess } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseIdParam, parseTaskInput, workActionError } from "@/lib/work/parse";
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
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      assignee_id: parsed.assignee_id,
      created_by: profile.id,
      description: parsed.description,
      priority: parsed.priority,
      deadline: parsed.deadline,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    fail(path, workActionError("Unable to create the task.", error?.message));
  }

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
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "in_progress" })
    .eq("id", taskId)
    .eq("assignee_id", profile.id)
    .eq("status", "pending")
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

  const nextStatus =
    current.status === "rejected"
      ? "resubmitted"
      : current.status === "in_progress"
        ? "submitted"
        : null;
  if (!nextStatus) {
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
    .update({ status: nextStatus })
    .eq("id", taskId)
    .eq("assignee_id", profile.id)
    .select("id, project_id")
    .maybeSingle();

  if (error || !data) {
    fail(
      `/tasks/${taskId}`,
      workActionError("Unable to submit the task.", error?.message),
    );
  }

  refreshTask(taskId, Number(data.project_id));
  redirect(`/tasks/${taskId}`);
}

export async function approveTask(formData: FormData) {
  await requireProjectHead();
  const taskId = parseIdParam(String(formData.get("task_id") ?? ""));
  if (!taskId) {
    fail("/projects", "That task was not found.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "approved" })
    .eq("id", taskId)
    .in("status", ["submitted", "resubmitted"])
    .select("id, project_id")
    .maybeSingle();

  if (error || !data) {
    fail(
      `/tasks/${taskId}`,
      workActionError("Unable to approve the task.", error?.message),
    );
  }

  refreshTask(taskId, Number(data.project_id));
  redirect(`/tasks/${taskId}`);
}

export async function rejectTask(formData: FormData) {
  const profile = await requireProjectHead();
  const taskId = parseIdParam(String(formData.get("task_id") ?? ""));
  if (!taskId) {
    fail("/projects", "That task was not found.");
  }

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    fail(`/tasks/${taskId}`, "A reason is required to reject a task.");
  }

  const supabase = await createClient();
  const { error: feedbackError } = await supabase.from("task_feedback").insert({
    task_id: taskId,
    reviewer_id: profile.id,
    reason,
  });
  if (feedbackError) {
    fail(
      `/tasks/${taskId}`,
      workActionError("Unable to reject the task.", feedbackError.message),
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "rejected" })
    .eq("id", taskId)
    .in("status", ["submitted", "resubmitted"])
    .select("id, project_id")
    .maybeSingle();

  if (error || !data) {
    fail(
      `/tasks/${taskId}`,
      workActionError("Unable to reject the task.", error?.message),
    );
  }

  refreshTask(taskId, Number(data.project_id));
  redirect(`/tasks/${taskId}`);
}
