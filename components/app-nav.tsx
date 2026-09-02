"use client";

import { signOut } from "@/app/actions/auth";
import type { NavItem } from "@/lib/roles";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "rounded-lg bg-canvas px-3 py-1.5 font-medium text-ink"
                : "rounded-lg px-3 py-1.5 text-muted transition hover:bg-canvas hover:text-ink"
            }
          >
            {item.label}
          </Link>
        );
      })}
      <form action={signOut} className="ml-1 border-l border-line pl-2">
        <button
          type="submit"
          className="rounded-lg px-3 py-1.5 text-muted transition hover:bg-canvas hover:text-ink"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}
