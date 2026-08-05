"use client";

import { useState, useTransition } from "react";
import { addQuote } from "@/app/(app)/quotes/actions";

export function QuoteForm() {
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const formData = new FormData();
    formData.set("text", text);
    formData.set("context", context);
    startTransition(async () => {
      await addQuote(formData);
      setText("");
      setContext("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-border bg-paper-raised p-4">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What'd he just say?"
        className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <input
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Context (optional) — who caught it, when, etc."
        className="mt-2 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper-raised transition hover:bg-accent-dark disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add quote"}
      </button>
    </form>
  );
}
