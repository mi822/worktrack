"use server";

import { DOCUMENT_BUCKET } from "@/lib/documents/types";
import { notifyUser } from "@/lib/notifications/queries";
import { requireManager, requireProjectHead } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseIdParam, parseProjectInput, workActionError } from "@/lib/work/parse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createProject(formData: FormData) {
  const profile = await requireManager();
  const parsed = parseProjectInput(formData);
  if (parsed.error) {
    fail("/projects/new", parsed.error);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      manager_id: profile.id,
      project_head_id: parsed.project_head_id,
      title: parsed.title,
      description: parsed.description,
      start_date: parsed.start_date,
      deadline: parsed.deadline,
      budget: parsed.budget,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    fail(
      "/projects/new",
      workActionError("Unable to create the project.", error?.message),
    );
  }

  revalidatePath("/projects");
  await notifyUser({
    recipientId: parsed.project_head_id,
    kind: "project_assigned",
    title: "Project assigned",
    body: parsed.title,
    href: `/projects/${data.id}`,
  });
  redirect(`/projects/${data.id}`);
}

export async function updateProject(formData: FormData) {
  await requireManager();
  const id = parseIdParam(String(formData.get("id") ?? ""));
  if (!id) {
    fail("/projects", "That project was not found.");
  }

  const parsed = parseProjectInput(formData);
  const path = `/projects/${id}/edit`;
  if (parsed.error) {
    fail(path, parsed.error);
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("projects")
    .select("project_head_id, status")
    .eq("id", id)
    .maybeSingle();

  if (current?.status === "closed") {
    fail(`/projects/${id}`, "Closed projects cannot be edited.");
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      project_head_id: parsed.project_head_id,
      title: parsed.title,
      description: parsed.description,
      start_date: parsed.start_date,
      deadline: parsed.deadline,
      budget: parsed.budget,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    fail(
      path,
      workActionError("Unable to update the project.", error?.message),
    );
  }

  if (parsed.project_head_id !== current?.project_head_id) {
    await notifyUser({
      recipientId: parsed.project_head_id,
      kind: "project_assigned",
      title: "Project assigned",
      body: parsed.title,
      href: `/projects/${id}`,
    });
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}?saved=1`);
}

export async function submitProjectForClosure(formData: FormData) {
  const profile = await requireProjectHead();
  const id = parseIdParam(String(formData.get("id") ?? ""));
  if (!id) {
    fail("/projects", "That project was not found.");
  }

  const path = `/projects/${id}`;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, manager_id, project_head_id, title")
    .eq("id", id)
    .maybeSingle();

  if (!project || project.project_head_id !== profile.id) {
    fail(path, "You are not allowed to submit this project.");
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "submit_project_for_closure",
    { p_project_id: id },
  );

  const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  if (rpcError || !row?.ok) {
    fail(
      path,
      workActionError(
        "Unable to submit the project.",
        (row?.code as string | undefined) ?? rpcError?.message,
      ),
    );
  }

  await notifyUser({
    recipientId: project.manager_id,
    kind: "project_submitted",
    title: "Project ready to close",
    body: project.title,
    href: path,
  });

  revalidatePath("/projects");
  revalidatePath(path);
  revalidatePath("/");
  redirect(`${path}?submitted=1`);
}

export async function closeProject(formData: FormData) {
  const profile = await requireManager();
  const id = parseIdParam(String(formData.get("id") ?? ""));
  if (!id) {
    fail("/projects", "That project was not found.");
  }

  const path = `/projects/${id}`;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, manager_id, project_head_id, title")
    .eq("id", id)
    .maybeSingle();

  if (!project || project.manager_id !== profile.id) {
    fail(path, "You are not allowed to close this project.");
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc("close_project", {
    p_project_id: id,
  });

  const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  if (rpcError || !row?.ok) {
    fail(
      path,
      workActionError(
        "Unable to close the project.",
        (row?.code as string | undefined) ?? rpcError?.message,
      ),
    );
  }

  if (project.project_head_id) {
    await notifyUser({
      recipientId: project.project_head_id,
      kind: "project_closed",
      title: "Project closed",
      body: project.title,
      href: path,
    });
  }

  revalidatePath("/projects");
  revalidatePath(path);
  revalidatePath("/");
  redirect(`${path}?closed=1`);
}

export async function deleteProject(formData: FormData) {
  const profile = await requireManager();
  const id = parseIdParam(String(formData.get("id") ?? ""));
  if (!id) {
    fail("/projects", "That project was not found.");
  }

  const path = `/projects/${id}`;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, manager_id")
    .eq("id", id)
    .maybeSingle();

  if (!project || project.manager_id !== profile.id) {
    fail(path, "You are not allowed to delete this project.");
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("project_id", id);
  const storagePaths = (documents ?? []).map((row) => row.storage_path);

  const { data: deleted, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !deleted) {
    fail(
      path,
      workActionError("Unable to delete the project.", error?.message),
    );
  }

  if (storagePaths.length > 0) {
    try {
      await createAdminClient().storage.from(DOCUMENT_BUCKET).remove(storagePaths);
    } catch {
      // Leftover files must not undo a completed delete.
    }
  }

  revalidatePath("/projects");
  revalidatePath("/documents");
  revalidatePath("/");
  redirect("/projects?deleted=1");
}
