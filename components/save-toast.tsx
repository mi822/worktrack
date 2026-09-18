"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SaveToast() {
  const params = useSearchParams();
  const saved = params.get("saved") === "1";
  const [visible, setVisible] = useState(saved);

  useEffect(() => {
    if (!saved) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, [saved]);

  if (!visible) {
    return null;
  }

  return (
    <p
      role="status"
      className="fixed bottom-5 right-5 z-40 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-[0_12px_32px_rgba(28,25,23,0.12)]"
    >
      Saved
    </p>
  );
}
