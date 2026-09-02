import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

function trimEnv(value: string | undefined) {
  return value?.trim() || undefined;
}

function parseDotEnvValue(raw: string) {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return trimEnv(value);
}

function findEnvLocalPath() {
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    const candidate = join(dir, ".env.local");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return join(process.cwd(), ".env.local");
}

function parseEnvFile(): Record<string, string> {
  const parsed: Record<string, string> = {};
  try {
    const text = readFileSync(findEnvLocalPath(), "utf8").replace(/^\uFEFF/, "");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const name = line.slice(0, eq).trim();
      const value = parseDotEnvValue(line.slice(eq + 1));
      if (name && value) parsed[name] = value;
    }
  } catch {
    // Production should supply keys through the process environment.
  }
  return parsed;
}

function readNamedKey(name: string) {
  return (
    trimEnv(process.env[name]) ?? parseEnvFile()[name]
  );
}

function isJwt(key: string) {
  return key.startsWith("eyJ");
}

function isNewSecret(key: string) {
  return key.startsWith("sb_secret_");
}

/** Auth Admin needs a JWT. Prefer the legacy service_role key. */
export function getAdminApiKey() {
  const serviceRole = readNamedKey("SUPABASE_SERVICE_ROLE_KEY");
  const secret = readNamedKey("SUPABASE_SECRET_KEY");

  if (serviceRole && isJwt(serviceRole)) return serviceRole;
  if (secret && isJwt(secret)) return secret;
  if (secret && isNewSecret(secret)) return secret;
  if (serviceRole && isNewSecret(serviceRole)) return serviceRole;
  if (serviceRole) return serviceRole;
  if (secret) return secret;

  const envPath = findEnvLocalPath();
  if (existsSync(envPath)) {
    throw new Error("EMPTY_SUPABASE_SECRET_KEY");
  }
  throw new Error("Missing SUPABASE_SECRET_KEY");
}

export function getSupabaseSecretKey() {
  return getAdminApiKey();
}
