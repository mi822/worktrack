import { NotificationBell } from "@/components/notification-bell";
import { listMyNotifications } from "@/lib/notifications/queries";

export async function NotificationBellSlot({
  placement = "header",
}: {
  placement?: "header" | "sidebar";
}) {
  const items = await listMyNotifications();
  return <NotificationBell items={items} placement={placement} />;
}

export function NotificationBellFallback() {
  return (
    <div
      className="inline-flex h-9 w-9 rounded-lg border border-line bg-white"
      aria-hidden="true"
    />
  );
}
