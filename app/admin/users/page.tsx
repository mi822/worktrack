import { listUsers } from "@/app/actions/users";
import { UsersManager } from "@/app/admin/users/users-manager";
import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";
import { APP_ROLES, isAppRole } from "@/lib/types";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const roleFilter =
    params.role && isAppRole(params.role) ? params.role : null;
  const users = await listUsers(roleFilter);

  return (
    <AppShell profile={profile}>
      <p className="field-caption">Admin</p>
      <h1 className="page-title mt-1">Users</h1>
      <UsersManager
        users={users}
        roleFilter={roleFilter}
        roles={[...APP_ROLES]}
      />
    </AppShell>
  );
}
