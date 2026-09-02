"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAppRole, type Profile } from "@/lib/types";

export async function listUsers(roleFilter: string | null): Promise<Profile[]> {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .order("full_name", { ascending: true });

  if (roleFilter && isAppRole(roleFilter)) {
    query = query.eq("role", roleFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load users.");
  }
  return (data ?? []) as Profile[];
}
