import type { NextConfig } from "next";
import os from "node:os";

function lanHosts(): string[] {
  const hosts: string[] = [];
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if ((addr.family === "IPv4" || Number(addr.family) === 4) && !addr.internal) {
        hosts.push(addr.address);
      }
    }
  }
  return hosts;
}

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: lanHosts(),
};

export default nextConfig;
