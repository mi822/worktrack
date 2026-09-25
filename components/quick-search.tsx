"use client";

import { NavIcon } from "@/components/nav-icon";
import type { NavItem } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function QuickSearch({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? items.filter((item) => item.label.toLowerCase().includes(needle))
    : items;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    function onPointer(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(href);
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-sm">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
        <NavIcon href="search" />
      </span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && matches[0]) {
            event.preventDefault();
            go(matches[0].href);
          }
          if (event.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        placeholder="Search pages…"
        aria-label="Search pages"
        className="h-10 w-full rounded-xl border border-transparent bg-canvas pl-10 pr-16 text-sm text-ink outline-none transition placeholder:text-muted focus:border-action focus:bg-white focus:ring-4 focus:ring-action/10"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-line bg-white px-1.5 py-0.5 text-[10px] font-semibold text-muted">
        Ctrl K
      </kbd>
      {open ? (
        <div className="absolute left-0 right-0 z-40 mt-2 rounded-2xl border border-line bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
          {matches.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted">No pages found.</p>
          ) : (
            <ul>
              {matches.map((item) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => go(item.href)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink-soft hover:bg-canvas hover:text-ink"
                  >
                    <NavIcon href={item.href} />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
