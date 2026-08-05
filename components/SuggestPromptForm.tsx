"use client";

import { useState, useTransition } from "react";
import { suggestPrompt } from "@/app/(app)/ask/actions";

const CATEGORIES = [
  "Childhood & Roots",
  "Turning Points",
  "Work & Building Things",
  "Love & Family",
  "For the Grandkids",
  "Crazy Moments & Stories",
  "Beliefs & Philosophy",
  "Photo Prompts",
  "Something else",
];

export function SuggestPromptForm() {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [pending, startTransition] = useTransition();
  const [justSent, setJustSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const formData = new FormData();
    formData.set("text", text);
    formData.set("category", category);
    startTransition(async () => {
      await suggestPrompt(formData);
      setText("");
      setCategory("");
      setJustSent(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-paper-raised p-4">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setJustSent(false);
        }}
        placeholder="What do you wish you could ask him? e.g. “Why did you name the shop what you did?”"
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-paper px-3 py-2 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="mt-2 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink-muted focus:border-accent focus:outline-none"
      >
        <option value="">Category (optional)</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending || !text.trim()}
        className="mt-3 rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper-raised transition hover:bg-accent-dark disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send it in"}
      </button>
      {justSent && <p className="mt-2 text-sm text-accent-dark">Sent — it'll go in front of Dave to approve before it enters rotation.</p>}
    </form>
  );
}
