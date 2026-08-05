"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteEntry } from "@/app/(app)/entry/[id]/actions";

const CONFIRM_DELAY_SECONDS = 3;

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CONFIRM_DELAY_SECONDS);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!confirming || secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [confirming, secondsLeft]);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => {
          setConfirming(true);
          setSecondsLeft(CONFIRM_DELAY_SECONDS);
        }}
        className="rounded-full border border-border px-4 py-1.5 text-sm text-ink-muted transition hover:border-accent-dark hover:text-accent-dark"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={secondsLeft > 0 || pending}
        onClick={() => startTransition(() => deleteEntry(entryId))}
        className="rounded-full bg-accent-dark px-4 py-1.5 text-sm font-medium text-paper-raised transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Deleting…" : secondsLeft > 0 ? `Confirm in ${secondsLeft}…` : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-ink-faint hover:text-ink"
      >
        Cancel
      </button>
    </div>
  );
}
