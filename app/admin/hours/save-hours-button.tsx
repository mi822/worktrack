"use client";

import { useFormStatus } from "react-dom";

export function SaveHoursButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Saving…" : "Save hours"}
    </button>
  );
}
