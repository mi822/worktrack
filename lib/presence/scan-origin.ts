import { headers } from "next/headers";
import os from "node:os";

function firstLanIPv4(): string | null {
  const candidates: string[] = [];
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if ((addr.family === "IPv4" || addr.family === 4) && !addr.internal) {
        candidates.push(addr.address);
      }
    }
  }
  return (
    candidates.find((ip) => ip.startsWith("192.168.") || ip.startsWith("10.")) ??
    candidates[0] ??
    null
  );
}

/**
 * Origin a phone on the same network can open. Localhost in the Host
 * header is rewritten to the machine’s LAN address so the QR is not
 * stuck on the computer.
 */
export async function phoneReachableOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3003";
  const hostname = host.split(":")[0] ?? host;
  const portPart = host.includes(":") ? host.slice(host.indexOf(":") + 1) : "";
  const forwardedProto = headerList.get("x-forwarded-proto");

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const lan = firstLanIPv4();
    if (lan) {
      return portPart ? `http://${lan}:${portPart}` : `http://${lan}`;
    }
  }

  const proto =
    forwardedProto === "https" || forwardedProto === "http"
      ? forwardedProto
      : "http";
  return `${proto}://${host}`;
}

export async function qrScanUrl(token: string): Promise<string> {
  const origin = await phoneReachableOrigin();
  return `${origin}/s/${encodeURIComponent(token)}`;
}
