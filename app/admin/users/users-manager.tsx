"use client";

import { EmptyNote, SectionHeader, StatusPill } from "@/components/dashboard/ui";
import { FormSubmitButton } from "@/components/form-submit-button";
import { initials } from "@/lib/initials";
import { ROLE_LABEL } from "@/lib/roles";
import type { AppRole, Profile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function postAdminUsers(formData: FormData, intent: string) {
  formData.set("intent", intent);
  const response = await fetch("/api/admin/users", {
    method: "POST",
    body: formData,
  });
  try {
    return (await response.json()) as { error: string | null };
  } catch {
    return { error: "Unable to update users." };
  }
}

export function UsersManager({
  users,
  roleFilter,
  roles,
}: {
  users: Profile[];
  roleFilter: AppRole | null;
  roles: AppRole[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  function onFilterChange(value: string) {
    const params = new URLSearchParams();
    if (value) {
      params.set("role", value);
    }
    const query = params.toString();
    router.push(query ? `/admin/users?${query}` : "/admin/users");
  }

  return (
    <div className="mt-6 space-y-6">
      {message ? <p className="alert-error">{message}</p> : null}

      <section className="panel p-5 sm:p-6">
        <SectionHeader
          icon="plus"
          title="Create account"
          description="New people sign in with the email and password you set here"
        />
        <form
          className="grid gap-4 min-[480px]:grid-cols-2"
          action={async (formData) => {
            const result = await postAdminUsers(formData, "create");
            setMessage(result.error);
            if (!result.error) {
              router.refresh();
            }
          }}
        >
          <label className="field-label">
            <span className="field-caption">Full name</span>
            <input name="full_name" required className="field-input" />
          </label>
          <label className="field-label">
            <span className="field-caption">Email</span>
            <input name="email" type="email" required className="field-input" />
          </label>
          <label className="field-label">
            <span className="field-caption">Initial password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="field-input"
            />
          </label>
          <label className="field-label">
            <span className="field-caption">Role</span>
            <select name="role" defaultValue="employee" className="field-input">
              {roles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </label>
          <div className="min-[480px]:col-span-2">
            <FormSubmitButton pendingLabel="Creating…">Create user</FormSubmitButton>
          </div>
        </form>
      </section>

      <section className="panel p-5 sm:p-6">
        <SectionHeader
          icon="/admin/users"
          title="Directory"
          description={
            users.length === 0
              ? "No accounts match this filter"
              : `${users.length} account${users.length === 1 ? "" : "s"}`
          }
          aside={
            <label className="flex items-center gap-2 text-sm text-muted">
              Role
              <select
                value={roleFilter ?? ""}
                onChange={(event) => onFilterChange(event.target.value)}
                className="field-input w-auto min-w-40"
              >
                <option value="">All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </option>
                ))}
              </select>
            </label>
          }
        />

        {users.length === 0 ? (
          <EmptyNote>No users found.</EmptyNote>
        ) : (
          <ul className="space-y-3">
            {users.map((user) => (
              <li key={user.id} className="stat-tile">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action/10 text-xs font-bold text-action">
                    {initials(user.full_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user.full_name}</p>
                    <p className="text-xs text-muted">{ROLE_LABEL[user.role]}</p>
                  </div>
                  <span className="ml-auto">
                    <StatusPill tone={user.is_active ? "ok" : "muted"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </StatusPill>
                  </span>
                </div>
                <form
                  className="grid gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4"
                  action={async (formData) => {
                    const result = await postAdminUsers(formData, "update");
                    setMessage(result.error);
                    if (!result.error) {
                      router.refresh();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={user.id} />
                  <label className="field-label">
                    <span className="field-caption">Name</span>
                    <input
                      name="full_name"
                      defaultValue={user.full_name}
                      required
                      className="field-input"
                    />
                  </label>
                  <label className="field-label">
                    <span className="field-caption">Role</span>
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="field-input"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-label">
                    <span className="field-caption">New password</span>
                    <input
                      name="password"
                      type="password"
                      minLength={8}
                      placeholder="Leave blank to keep"
                      className="field-input"
                    />
                  </label>
                  <div className="flex flex-wrap items-end gap-2">
                    <FormSubmitButton pendingLabel="Saving…" className="btn-secondary">
                      Save
                    </FormSubmitButton>
                    <button
                      type="submit"
                      formAction={async () => {
                        const formData = new FormData();
                        formData.set("id", user.id);
                        formData.set(
                          "is_active",
                          user.is_active ? "false" : "true",
                        );
                        const result = await postAdminUsers(
                          formData,
                          "set-active",
                        );
                        setMessage(result.error);
                        if (!result.error) {
                          router.refresh();
                        }
                      }}
                      className="btn-secondary"
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
