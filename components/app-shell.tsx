import { BrandMark } from "@/components/brand-mark";
import { AppNav } from "@/components/app-nav";
import { ROLE_LABEL, navForRole } from "@/lib/roles";
import type { Profile } from "@/lib/types";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const nav = navForRole(profile.role);

  return (
    <div className="min-h-full bg-canvas text-ink">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">WorkTrack</p>
              <p className="truncate text-xs text-muted">
                {profile.full_name}
                <span className="mx-1.5 text-muted">·</span>
                {ROLE_LABEL[profile.role]}
              </p>
            </div>
          </div>
          <AppNav items={nav} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
