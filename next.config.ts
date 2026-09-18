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
  allowedDevOrigins: ["127.0.0.1", "localhost", ...lanHosts()],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
