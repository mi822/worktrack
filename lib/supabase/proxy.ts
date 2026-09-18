import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/public-env";
import { safeScanReturnPath, isPresenceScanPath } from "@/lib/presence/scan-payload";
import { isAppRole, type AppRole } from "@/lib/types";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("-auth-token"));
}

function needsProfileForPath(path: string) {
  return (
    path.startsWith("/admin") ||
    path === "/scan" ||
    path.startsWith("/s/") ||
    path.startsWith("/attendance") ||
    path.startsWith("/projects") ||
    path.startsWith("/tasks") ||
    path.startsWith("/summary") ||
    path.startsWith("/learning-log") ||
    path.startsWith("/intern-logs") ||
    path.startsWith("/performance") ||
    path.startsWith("/timesheet") ||
    path.startsWith("/surveys") ||
    path.startsWith("/documents")
  );
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";

  if (!hasSupabaseAuthCookie(request)) {
    if (isLogin) {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    const attempted = request.nextUrl.pathname + request.nextUrl.search;
    url.pathname = "/login";
    url.search = isPresenceScanPath(request.nextUrl.pathname)
      ? `?next=${encodeURIComponent(attempted)}`
      : "";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) {
    if (!isLogin) {
      const url = request.nextUrl.clone();
      const attempted = request.nextUrl.pathname + request.nextUrl.search;
      url.pathname = "/login";
      url.search = isPresenceScanPath(request.nextUrl.pathname)
          ? `?next=${encodeURIComponent(attempted)}`
          : "";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (!isLogin && !needsProfileForPath(path)) {
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.is_active !== true) {
    await supabase.auth.signOut();
    if (!isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (isLogin) {
    const dest = safeScanReturnPath(request.nextUrl.searchParams.get("next"));
    const url = request.nextUrl.clone();
    const [destPath, destQuery] = dest.split("?");
    url.pathname = destPath || "/";
    url.search = destQuery ? `?${destQuery}` : "";
    return NextResponse.redirect(url);
  }

  const role: AppRole | null = isAppRole(profile.role) ? profile.role : null;
  if (path.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if ((path === "/scan" || path.startsWith("/s/")) && role === "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/attendance")) {
    if (role === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/attendance";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (
      role !== "intern" &&
      role !== "employee" &&
      role !== "project_head" &&
      role !== "manager"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (
    path.startsWith("/projects") &&
    role !== "manager" &&
    role !== "project_head"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    (path === "/projects/new" || /\/projects\/[^/]+\/edit$/.test(path)) &&
    role !== "manager"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/tasks")) {
    const canOpenTask =
      role === "employee" ||
      role === "intern" ||
      role === "project_head" ||
      role === "manager";
    if (!canOpenTask) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (
      path === "/tasks" &&
      (role === "project_head" || role === "manager")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/projects";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/summary") && role !== "employee") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/learning-log") && role !== "intern") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/intern-logs") && role !== "project_head") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    (path === "/surveys/new" ||
      /\/surveys\/[^/]+\/edit$/.test(path) ||
      /\/surveys\/[^/]+\/results$/.test(path)) &&
    role !== "admin" &&
    role !== "manager"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/surveys";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
