"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SaveToast() {
  const params = useSearchParams();
  const saved = params.get("saved") === "1";
  const [visible, setVisible] = useState(saved);
  const [prevSaved, setPrevSaved] = useState(saved);
  if (saved !== prevSaved) {
    setPrevSaved(saved);
    setVisible(saved);
  }

  useEffect(() => {
    if (!saved) {
      return;
    }
    const timer = window.setTimeout(() => setVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, [saved]);

  if (!visible) {
    return null;
  }

  return (
    <p
      role="status"
      className="fixed bottom-24 right-5 z-40 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_32px_rgba(15,23,42,0.18)] lg:bottom-5"
    >
      Saved
    </p>
  );
}
