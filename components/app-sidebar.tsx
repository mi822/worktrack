"use client";

import { AppNav } from "@/components/app-nav";
import { BrandMark } from "@/components/brand-mark";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { NavIcon } from "@/components/nav-icon";
import { QuickSearch } from "@/components/quick-search";
import { UserMenu } from "@/components/user-menu";
import { ROLE_LABEL } from "@/lib/roles";
import type { MobileTabs, NavItem } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import { useState, type ReactNode } from "react";

export function AppSidebar({
  profile,
  items,
  mobileTabs,
  today,
  bell,
  children,
}: {
  profile: Profile;
  items: NavItem[];
  mobileTabs: MobileTabs;
  today: string;
  bell: ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full text-ink">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-line/70 lg:bg-sidebar">
        <SidebarBrand />
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-5 pt-2">
          <AppNav items={items} />
        </div>
      </aside>

      <div className="flex min-h-full flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-canvas px-4 sm:px-6 lg:border-b lg:border-line/70 lg:bg-white lg:px-10">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <BrandMark className="h-9 w-9" />
            <div className="min-w-0">
              <p className="font-display truncate text-sm font-bold tracking-tight text-ink">
                Work<span className="text-action">Track</span>
              </p>
              <p className="truncate text-xs text-muted">{profile.full_name}</p>
            </div>
          </div>
          <div className="hidden flex-1 lg:block">
            <QuickSearch items={items} />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <p className="hidden items-center gap-2 text-sm text-ink-soft lg:flex">
              <span className="text-muted">
                <NavIcon href="/attendance" />
              </span>
              {today}
            </p>
            <span className="top-divider" aria-hidden="true" />
            {bell}
            <span className="top-divider" aria-hidden="true" />
            <div className="hidden lg:block">
              <UserMenu profile={profile} />
            </div>
          </div>
        </header>

        {open ? (
          <div className="fixed inset-0 z-30 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/40"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <div
              id="mobile-sidebar"
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col rounded-r-3xl bg-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
            >
              <SidebarBrand profile={profile} />
              <div className="flex min-h-0 flex-1 flex-col px-3 pb-5 pt-2">
                <AppNav items={items} onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>

      <MobileTabBar tabs={mobileTabs} onMore={() => setOpen(true)} />
    </div>
  );
}

function SidebarBrand({ profile }: { profile?: Profile }) {
  return (
    <div className="flex h-16 items-center gap-3 px-5">
      <BrandMark className="h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-bold tracking-tight text-ink">
          Work<span className="text-action">Track</span>
        </p>
        {profile ? (
          <p className="truncate text-xs text-muted">
            <span className="text-ink-soft">{profile.full_name}</span>
            <span className="mx-1 text-line">·</span>
            <span>{ROLE_LABEL[profile.role]}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
