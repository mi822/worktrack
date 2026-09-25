"use client";

import { signOut } from "@/app/actions/auth";
import { FormSubmitButton } from "@/components/form-submit-button";
import { NavIcon } from "@/components/nav-icon";
import type { NavItem } from "@/lib/roles";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={active ? "nav-link-active" : "nav-link"}
          >
            <NavIcon href={item.href} size="lg" />
            {item.label}
          </Link>
        );
      })}
      <form action={signOut} className="mt-auto border-t border-line/70 pt-4">
        <FormSubmitButton
          pendingLabel="Signing out…"
          className="nav-link w-full justify-start hover:bg-bad/5 hover:text-bad"
        >
          <NavIcon href="logout" size="lg" />
          Logout
        </FormSubmitButton>
      </form>
    </nav>
  );
}
