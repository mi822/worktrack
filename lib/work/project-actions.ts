"use server";

import { requireManager } from "@/lib/auth";
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

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}?saved=1`);
}
