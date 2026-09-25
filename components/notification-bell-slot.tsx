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
      className="inline-flex h-10 w-10 rounded-full border border-line bg-white"
      aria-hidden="true"
    />
  );
}
