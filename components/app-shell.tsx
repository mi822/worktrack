import { AppSidebar } from "@/components/app-sidebar";
import {
  NotificationBellFallback,
  NotificationBellSlot,
} from "@/components/notification-bell-slot";
import { SaveToast } from "@/components/save-toast";
import { navForRole } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import { Suspense } from "react";

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
        headerBell={
          <Suspense fallback={<NotificationBellFallback />}>
            <NotificationBellSlot />
          </Suspense>
        }
        sidebarBell={
          <Suspense fallback={<NotificationBellFallback />}>
            <NotificationBellSlot placement="sidebar" />
          </Suspense>
        }
        drawerBell={
          <Suspense fallback={<NotificationBellFallback />}>
            <NotificationBellSlot placement="sidebar" />
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
