import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  isNotificationKind,
  type NotificationKind,
  type NotificationRow,
} from "@/lib/notifications/types";

export const listMyNotifications = cache(async (): Promise<NotificationRow[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return [];
  }

  return data.flatMap((row) => {
    if (!isNotificationKind(row.kind)) {
      return [];
    }
    return [
      {
        id: Number(row.id),
        kind: row.kind,
        title: row.title,
        body: row.body,
        href: row.href,
        read_at: row.read_at,
        created_at: row.created_at,
      },
    ];
  });
});

export async function notifyUser(input: {
  recipientId: string | null | undefined;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
}): Promise<void> {
  if (!input.recipientId) {
    return;
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("notify_user", {
      p_recipient_id: input.recipientId,
      p_kind: input.kind,
      p_title: clip(input.title, 160),
      p_body: clip(input.body, 400),
      p_href: input.href,
    });
    void error;
  } catch {
    // Never block the action that triggered the notice.
  }
}

function clip(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
