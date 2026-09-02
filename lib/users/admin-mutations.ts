import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAppRole, type AppRole, type Profile } from "@/lib/types";
import { revalidatePath } from "next/cache";

function asString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function getAdminClientOrError() {
  try {
    return { service: createAdminClient(), error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "EMPTY_SUPABASE_SECRET_KEY") {
      return {
        service: null,
        error:
          "SUPABASE_SERVICE_ROLE_KEY in .env.local is empty. Paste the Legacy service_role JWT, save the file, and restart the app.",
      };
    }
    return {
      service: null,
      error:
        "Server is missing SUPABASE_SERVICE_ROLE_KEY. Copy the Legacy service_role key from the Supabase dashboard into .env.local and restart the app.",
    };
  }
}

async function updateProfileAsCaller(
  id: string,
  patch: Partial<Pick<Profile, "full_name" | "role" | "is_active">>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "Unable to update the profile." };
  }
  return { error: null };
}

export async function createUserRecord(formData: FormData) {
  await requireAdmin();
  const email = asString(formData.get("email"));
  const password = asString(formData.get("password"));
  const fullName = asString(formData.get("full_name"));
  const roleValue = asString(formData.get("role"));

  if (!email || !password || !fullName || !isAppRole(roleValue)) {
    return { error: "Name, email, password, and role are required." };
  }

  const admin = getAdminClientOrError();
  if (!admin.service) {
    return { error: admin.error };
  }
  const service = admin.service;

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role: roleValue },
  });

  if (error || !data.user) {
    const message = error?.message ?? "";
    if (error?.status === 401 || /invalid jwt|unauthorized|bad_jwt/i.test(message)) {
      return {
        error:
          "Supabase Auth rejected the admin key. Add the Legacy service_role JWT to SUPABASE_SERVICE_ROLE_KEY in .env.local, save, and restart the app.",
      };
    }
    if (/already been registered|already exists|duplicate/i.test(message)) {
      return { error: "An account with this email already exists." };
    }
    if (/password/i.test(message)) {
      return { error: "The password does not meet the project's requirements." };
    }
    return { error: "Unable to create the account." };
  }

  const { error: profileError } = await updateProfileAsCaller(data.user.id, {
    full_name: fullName,
    role: roleValue as AppRole,
    is_active: true,
  });

  if (profileError) {
    return { error: "Account created but profile update failed." };
  }

  revalidatePath("/admin/users");
  return { error: null };
}

export async function updateUserRecord(formData: FormData) {
  const caller = await requireAdmin();
  const id = asString(formData.get("id"));
  const fullName = asString(formData.get("full_name"));
  const roleValue = asString(formData.get("role"));
  const password = asString(formData.get("password"));

  if (!id || !fullName || !isAppRole(roleValue)) {
    return { error: "Name and role are required." };
  }

  if (id === caller.id && roleValue !== "admin") {
    return { error: "You cannot change your own role." };
  }

  const { error: profileError } = await updateProfileAsCaller(id, {
    full_name: fullName,
    role: roleValue as AppRole,
  });

  if (profileError) {
    return { error: "Unable to update the account." };
  }

  const admin = getAdminClientOrError();
  if (!admin.service) {
    return { error: admin.error };
  }
  const service = admin.service;

  const authPatch: {
    user_metadata: { full_name: string };
    app_metadata: { role: AppRole };
    password?: string;
  } = {
    user_metadata: { full_name: fullName },
    app_metadata: { role: roleValue },
  };
  if (password) {
    authPatch.password = password;
  }

  const { error: authError } = await service.auth.admin.updateUserById(
    id,
    authPatch,
  );
  if (authError) {
    return { error: "Unable to update credentials." };
  }

  revalidatePath("/admin/users");
  return { error: null };
}

export async function setUserActiveRecord(formData: FormData) {
  const caller = await requireAdmin();
  const id = asString(formData.get("id"));
  const isActive = asString(formData.get("is_active")) === "true";

  if (!id) {
    return { error: "User is required." };
  }
  if (id === caller.id && !isActive) {
    return { error: "You cannot deactivate your own account." };
  }

  const { error } = await updateProfileAsCaller(id, { is_active: isActive });

  if (error) {
    return { error: "Unable to update account status." };
  }

  revalidatePath("/admin/users");
  return { error: null };
}
