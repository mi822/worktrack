"use client";

import { AppNav } from "@/components/app-nav";
import { BrandMark } from "@/components/brand-mark";
import { ROLE_LABEL } from "@/lib/roles";
import type { NavItem } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import { useState, type ReactNode } from "react";

export function AppSidebar({
  profile,
  items,
  headerBell,
  sidebarBell,
  drawerBell,
  children,
}: {
  profile: Profile;
  items: NavItem[];
  headerBell: ReactNode;
  sidebarBell: ReactNode;
  drawerBell: ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full text-ink">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-line lg:bg-sidebar">
        <SidebarBrand profile={profile} bell={sidebarBell} />
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-5 pt-1">
          <AppNav items={items} />
        </div>
      </aside>

      <div className="flex min-h-full flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            className="btn-secondary h-10 w-10 shrink-0 px-0"
            aria-expanded={open}
            aria-controls="mobile-sidebar"
            onClick={() => setOpen(true)}
          >
            <span className="sr-only">Open menu</span>
            <svg className="mx-auto h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 5h10M3 8h10M3 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <BrandMark className="h-8 w-8" />
          <div className="min-w-0">
            <p className="font-display truncate text-sm font-semibold tracking-tight text-ink">
              Work<span className="text-action">Track</span>
            </p>
            <p className="truncate text-xs text-teal">{profile.full_name}</p>
          </div>
          <div className="ml-auto">{headerBell}</div>
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
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-line bg-white shadow-[0_16px_40px_rgba(11,31,58,0.16)]"
            >
              <SidebarBrand profile={profile} bell={drawerBell} />
              <div className="flex min-h-0 flex-1 flex-col px-3 pb-5 pt-1">
                <AppNav items={items} onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarBrand({
  profile,
  bell,
}: {
  profile: Profile;
  bell: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-5">
      <BrandMark className="h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-[0.95rem] font-semibold tracking-tight text-ink">
          Work<span className="text-action">Track</span>
        </p>
        <p className="truncate text-[11px] text-muted">
          <span className="text-ink-soft">{profile.full_name}</span>
          <span className="mx-1 text-line">·</span>
          <span className="text-teal">{ROLE_LABEL[profile.role]}</span>
        </p>
      </div>
      {bell}
    </div>
  );
}
