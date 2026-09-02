const TOKEN_SEGMENT = /^[A-Za-z0-9_-]+$/;

function pathOnly(raw: string) {
  return raw.split("?")[0] ?? raw;
}

export function isPresenceScanPath(pathname: string): boolean {
  if (pathname === "/scan") {
    return true;
  }
  if (!pathname.startsWith("/s/")) {
    return false;
  }
  const rest = pathname.slice(3);
  if (!rest || rest.includes("/")) {
    return false;
  }
  try {
    return TOKEN_SEGMENT.test(decodeURIComponent(rest));
  } catch {
    return false;
  }
}

/** Pull the opaque QR token out of a raw payload, /scan?t=…, or /s/… URL. */
export function tokenFromScanPayload(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed, "http://worktrack.local");
    const fromQuery = url.searchParams.get("t");
    if (fromQuery) {
      return fromQuery;
    }
    if (url.pathname.startsWith("/s/")) {
      const rest = url.pathname.slice(3);
      if (rest && !rest.includes("/")) {
        return decodeURIComponent(rest);
      }
    }
  } catch {
    // Not a URL — treat the whole string as the token.
  }
  return trimmed;
}

/** Only presence-scan paths are safe post-login return paths. */
export function safeScanReturnPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/";
  }
  const path = pathOnly(raw);
  if (!isPresenceScanPath(path)) {
    return "/";
  }
  return path === "/scan" ? raw : path;
}
