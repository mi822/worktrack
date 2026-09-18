"use client";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/actions";
import type { NotificationRow } from "@/lib/notifications/types";
import { formatDateTime } from "@/lib/format-date";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export function NotificationBell({
  items,
  placement = "header",
}: {
  items: NotificationRow[];
  placement?: "header" | "sidebar";
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const unread = items.filter((item) => !item.read_at).length;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointer(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition hover:bg-canvas"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 2.5a3.5 3.5 0 0 0-3.5 3.5v1.4c0 .4-.2.8-.5 1.1L3 9.8h10l-1-1.3c-.3-.3-.5-.7-.5-1.1V6A3.5 3.5 0 0 0 8 2.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M6.5 12.2a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-action px-1 text-[10px] font-medium text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={
            placement === "sidebar"
              ? "absolute left-full top-0 z-40 ml-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-2 shadow-[0_8px_24px_rgba(28,25,23,0.05)]"
              : "absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-2 shadow-[0_8px_24px_rgba(28,25,23,0.05)]"
          }
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-action"
                onClick={() => {
                  startTransition(async () => {
                    await markAllNotificationsRead();
                    router.refresh();
                  });
                }}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">No notifications.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="block rounded-xl px-2 py-2 hover:bg-canvas"
                    onClick={() => {
                      setOpen(false);
                      if (!item.read_at) {
                        startTransition(async () => {
                          const formData = new FormData();
                          formData.set("id", String(item.id));
                          await markNotificationRead(formData);
                          router.refresh();
                        });
                      }
                    }}
                  >
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.body}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {formatDateTime(item.created_at)}
                      {item.read_at ? "" : " · Unread"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
