import { AppSidebar } from "@/components/app-sidebar";
import {
  NotificationBellFallback,
  NotificationBellSlot,
} from "@/components/notification-bell-slot";
import { SaveToast } from "@/components/save-toast";
import { FALLBACK_WORK_TIMEZONE } from "@/lib/logs/work-date";
import { mobileTabsForRole, navForRole } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import { Suspense } from "react";

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: FALLBACK_WORK_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

export async function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <>
      <AppSidebar
        profile={profile}
        items={navForRole(profile.role)}
        mobileTabs={mobileTabsForRole(profile.role)}
        today={todayLabel()}
        bell={
          <Suspense fallback={<NotificationBellFallback />}>
            <NotificationBellSlot />
          </Suspense>
        }
      >
        {children}
      </AppSidebar>
      <Suspense fallback={null}>
        <SaveToast />
      </Suspense>
    </>
  );
}
