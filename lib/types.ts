export const APP_ROLES = [
  "intern",
  "employee",
  "project_head",
  "manager",
  "admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type Profile = {
  id: string;
  full_name: string;
  role: AppRole;
  is_active: boolean;
};

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}
