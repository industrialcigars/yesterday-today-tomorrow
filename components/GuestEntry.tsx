"use client";

import { useState } from "react";
import { chooseGuestByName } from "@/app/(auth)/login/actions";

export function GuestEntry() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-border px-4 py-3 text-left text-base font-medium text-ink-muted transition hover:border-accent hover:text-accent-dark"
      >
        Guest (enter their name manually)
      </button>
    );
  }

  return (
    <form action={chooseGuestByName} className="rounded-lg border border-border bg-paper-raised p-3">
      <input
        type="text"
        name="name"
        autoFocus
        placeholder="Type their name"
        className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        className="mt-2 w-full rounded-lg bg-ink px-4 py-2 text-base font-medium text-paper-raised transition hover:bg-accent-dark"
      >
        Continue
      </button>
    </form>
  );
}
