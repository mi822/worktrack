"use server";

import { requireProfile } from "@/lib/auth";
import {
  DOCUMENT_BUCKET,
  DOCUMENT_MAX_BYTES,
  isAllowedDocumentMime,
  safeFileName,
} from "@/lib/documents/types";
import { parseIdParam } from "@/lib/work/parse";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function uploadDocument(formData: FormData) {
  const profile = await requireProfile();
  const projectId = parseIdParam(String(formData.get("project_id") ?? ""));
  const taskRaw = String(formData.get("task_id") ?? "").trim();
  const taskId = taskRaw ? parseIdParam(taskRaw) : null;
  const file = formData.get("file");
  const returnTo = String(formData.get("return_to") ?? "").trim() || "/documents";

  if (!projectId) {
    fail(returnTo, "Choose a project.");
  }
  if (!(file instanceof File) || file.size === 0) {
    fail(returnTo, "Choose a file.");
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    fail(returnTo, "Files must be 10 MB or smaller.");
  }
  const mime = file.type || "application/octet-stream";
  if (!isAllowedDocumentMime(mime)) {
    fail(returnTo, "That file type is not allowed.");
  }

  const id = crypto.randomUUID();
  const name = safeFileName(file.name);
  const path = taskId
    ? `${projectId}/task/${taskId}/${id}_${name}`
    : `${projectId}/project/${id}_${name}`;

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });
  if (uploaded.error) {
    fail(returnTo, "Unable to upload the file.");
  }

  const inserted = await supabase.from("documents").insert({
    storage_path: path,
    file_name: file.name.slice(0, 200),
    mime_type: mime,
    byte_size: file.size,
    uploaded_by: profile.id,
    project_id: projectId,
    task_id: taskId,
  });
  if (inserted.error) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
    fail(returnTo, "You are not allowed to attach that file.");
  }

  // Assignee uploading work on a started task also submits it for review.
  if (taskId) {
    const { data: task } = await supabase
      .from("tasks")
      .select("id, project_id, status, assignee_id")
      .eq("id", taskId)
      .maybeSingle();

    if (
      task &&
      task.assignee_id === profile.id &&
      (task.status === "in_progress" ||
        task.status === "assigned" ||
        task.status === "rejected")
    ) {
      if (task.status === "assigned" || task.status === "rejected") {
        await supabase
          .from("tasks")
          .update({ status: "in_progress" })
          .eq("id", taskId)
          .eq("assignee_id", profile.id)
          .in("status", ["assigned", "rejected"]);
      }

      const { error: submitInsertError } = await supabase
        .from("task_submissions")
        .insert({
          task_id: taskId,
          submitted_by: profile.id,
          notes: `Submitted with document: ${file.name.slice(0, 120)}`,
        });

      if (!submitInsertError) {
        await supabase
          .from("tasks")
          .update({ status: "submitted" })
          .eq("id", taskId)
          .eq("assignee_id", profile.id)
          .eq("status", "in_progress");
      }

      revalidatePath(`/tasks/${taskId}`);
      revalidatePath(`/projects/${projectId}`);
      revalidatePath("/");
    }
  }

  revalidatePath(returnTo);
  redirect(`${returnTo}?saved=1`);
}

export async function downloadDocument(formData: FormData) {
  await requireProfile();
  const id = parseIdParam(String(formData.get("id") ?? ""));
  const returnTo = String(formData.get("return_to") ?? "").trim() || "/documents";
  if (!id) {
    fail(returnTo, "Unknown file.");
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!data) {
    fail(returnTo, "File not found.");
  }
  const signed = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(data.storage_path, 60);
  if (!signed.data?.signedUrl) {
    fail(returnTo, "Unable to open the file.");
  }
  redirect(signed.data.signedUrl);
}

export async function deleteDocument(formData: FormData) {
  await requireProfile();
  const id = parseIdParam(String(formData.get("id") ?? ""));
  const returnTo = String(formData.get("return_to") ?? "").trim() || "/documents";
  if (!id) {
    fail(returnTo, "Unknown file.");
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!data) {
    fail(returnTo, "File not found.");
  }
  const removed = await supabase.from("documents").delete().eq("id", id);
  if (removed.error) {
    fail(returnTo, "You cannot delete that file.");
  }
  await supabase.storage.from(DOCUMENT_BUCKET).remove([data.storage_path]);
  revalidatePath(returnTo);
  redirect(returnTo);
}
