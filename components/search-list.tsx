"use client";

import { EmptyNote } from "@/components/dashboard/ui";
import { useMemo, useState, Fragment } from "react";

export function SearchList({
  placeholder,
  emptyTitle,
  emptyHint,
  items,
}: {
  placeholder: string;
  emptyTitle: string;
  emptyHint: string;
  items: { key: string; haystack: string; node: React.ReactNode }[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return items;
    }
    return items.filter((item) => item.haystack.toLowerCase().includes(needle));
  }, [items, query]);

  if (items.length === 0) {
    return <EmptyNote title={emptyTitle}>{emptyHint}</EmptyNote>;
  }

  return (
    <div>
      <label className="field-label">
        <span className="field-caption">Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="field-input"
        />
      </label>
      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyNote title="No matches.">Try a different name or word.</EmptyNote>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {filtered.map((item) => (
            <Fragment key={item.key}>{item.node}</Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
