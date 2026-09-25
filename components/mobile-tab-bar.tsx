"use client";

import { NavIcon } from "@/components/nav-icon";
import type { MobileTabs, NavItem } from "@/lib/roles";
import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

function Tab({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
        active ? "text-action" : "text-muted hover:text-ink"
      }`}
    >
      <NavIcon href={item.href} size="lg" />
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  );
}

export function MobileTabBar({
  tabs,
  onMore,
}: {
  tabs: MobileTabs;
  onMore: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(15,23,42,0.06)] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-end px-2">
        {tabs.left.map((item) => (
          <Tab key={item.href} item={item} pathname={pathname} />
        ))}

        <div className="flex flex-1 justify-center">
          <Link
            href={tabs.center.href}
            aria-label={tabs.center.label}
            className="-mt-6 mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-action text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] ring-4 ring-white transition-colors hover:bg-accent"
          >
            {tabs.center.href === "/scan" || tabs.center.href === "/admin/qr" ? (
              <NavIcon href={tabs.center.href} size="lg" />
            ) : (
              <NavIcon href="plus" size="lg" />
            )}
          </Link>
        </div>

        {tabs.right.map((item) => (
          <Tab key={item.href} item={item} pathname={pathname} />
        ))}

        <button
          type="button"
          onClick={onMore}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted transition-colors hover:text-ink"
        >
          <NavIcon href="more" size="lg" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
