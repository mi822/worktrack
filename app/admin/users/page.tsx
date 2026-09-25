import { listUsers } from "@/app/actions/users";
import { UsersManager } from "@/app/admin/users/users-manager";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/dashboard/ui";
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
      <PageHeader
        icon="/admin/users"
        caption="Admin"
        title="Users"
        description="Create accounts, change roles and reset passwords"
      />
      <UsersManager
        users={users}
        roleFilter={roleFilter}
        roles={[...APP_ROLES]}
      />
    </AppShell>
  );
}
