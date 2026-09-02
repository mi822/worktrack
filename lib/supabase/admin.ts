import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/public-env";
import { getAdminApiKey } from "@/lib/supabase/secret";

function isNewApiKey(key: string) {
  return key.startsWith("sb_secret_") || key.startsWith("sb_publishable_");
}

/**
 * New secret keys are not JWTs. Auth admin rejects them on
 * `Authorization: Bearer …`. Send them on `apikey` only.
 * Prefer a legacy service_role JWT so createUser can succeed.
 */
function fetchWithoutSecretBearer(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    const authorization = headers.get("Authorization");
    if (
      authorization &&
      (authorization === `Bearer ${key}` ||
        /Bearer sb_(secret|publishable)_/.test(authorization))
    ) {
      headers.delete("Authorization");
    }
    if (!headers.has("apikey")) {
      headers.set("apikey", key);
    }
    return fetch(input, { ...init, headers });
  };
}

export function createAdminClient() {
  const key = getAdminApiKey();
  return createClient(getSupabaseUrl(), key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: isNewApiKey(key)
      ? { fetch: fetchWithoutSecretBearer(key) }
      : undefined,
  });
}
