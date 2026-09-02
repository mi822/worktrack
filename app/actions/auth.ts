"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeScanReturnPath } from "@/lib/presence/scan-payload";

const GENERIC_SIGN_IN_ERROR = "Invalid email or password.";

function loginErrorPath(next: string) {
  if (next === "/") {
    return "/login?error=1";
  }
  return `/login?error=1&next=${encodeURIComponent(next)}`;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeScanReturnPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    redirect(loginErrorPath(next));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(loginErrorPath(next));
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    await supabase.auth.signOut();
    redirect(loginErrorPath(next));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.is_active !== true) {
    await supabase.auth.signOut();
    redirect(loginErrorPath(next));
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getSignInErrorMessage(errorFlag: string | undefined) {
  if (!errorFlag) {
    return null;
  }
  return GENERIC_SIGN_IN_ERROR;
}
