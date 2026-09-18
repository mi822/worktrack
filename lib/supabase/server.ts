import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/public-env";

export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            void key;
            void value;
          });
        } catch {
          // Called from a Server Component; proxy refreshes the session.
        }
      },
    },
  });
});
