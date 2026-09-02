import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAppRole, type Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!data || data.is_active !== true || !isAppRole(data.role)) {
    return null;
  }

  return {
    id: data.id,
    full_name: data.full_name,
    role: data.role,
    is_active: data.is_active,
  };
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Not authenticated");
  }
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    throw new Error("Forbidden");
  }
  return profile;
}

export async function requireScanner(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role === "admin") {
    redirect("/");
  }
  return profile;
}

export async function requireManager(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "manager") {
    redirect("/");
  }
  return profile;
}

export async function requireProjectHead(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "project_head") {
    redirect("/");
  }
  return profile;
}

export async function requireManagerOrHead(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "manager" && profile.role !== "project_head") {
    redirect("/");
  }
  return profile;
}

export async function requireEmployee(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "employee") {
    redirect("/");
  }
  return profile;
}

export async function requireIntern(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "intern") {
    redirect("/");
  }
  return profile;
}

export async function requireWorker(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "employee" && profile.role !== "intern") {
    redirect("/");
  }
  return profile;
}

export async function requireTaskAccess(): Promise<Profile> {
  const profile = await requireProfile();
  if (
    profile.role !== "employee" &&
    profile.role !== "intern" &&
    profile.role !== "project_head" &&
    profile.role !== "manager"
  ) {
    redirect("/");
  }
  return profile;
}
