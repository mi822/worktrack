"use client";

import { signOut } from "@/app/actions/auth";
import { FormSubmitButton } from "@/components/form-submit-button";
import { NavIcon } from "@/components/nav-icon";
import { firstName, initials } from "@/lib/initials";
import { ROLE_LABEL } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

export function UserMenu({ profile }: { profile: Profile }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-canvas"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-action/10 text-xs font-bold text-action">
          {initials(profile.full_name)}
        </span>
        <span className="max-w-32 truncate text-sm font-semibold text-ink">
          {firstName(profile.full_name)}
        </span>
        <span className="text-muted">
          <NavIcon href="chevron-down" />
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 rounded-2xl border border-line bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{profile.full_name}</p>
            <p className="text-xs text-muted">{ROLE_LABEL[profile.role]}</p>
          </div>
          <form action={signOut} className="mt-1 border-t border-line/70 pt-1">
            <FormSubmitButton
              pendingLabel="Signing out…"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink-soft hover:bg-bad/5 hover:text-bad"
            >
              <NavIcon href="logout" />
              Logout
            </FormSubmitButton>
          </form>
        </div>
      ) : null}
    </div>
  );
}
