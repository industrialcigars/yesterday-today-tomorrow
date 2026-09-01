"use client";

import { useRef, useState, useTransition } from "react";
import { addComment } from "@/app/(app)/entry/[id]/actions";
import { compressImageIfNeeded } from "@/lib/compressImage";

export function CommentForm({ entryId }: { entryId: string }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    if (!picked) {
      setFile(null);
      return;
    }
    setPreparing(true);
    try {
      setFile(await compressImageIfNeeded(picked));
    } finally {
      setPreparing(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    const formData = new FormData();
    formData.set("text", text);
    if (file) formData.set("file", file);
    startTransition(async () => {
      await addComment(entryId, formData);
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-paper-raised p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add your own memory of this, or just say what you remember…"
        rows={2}
        className="w-full resize-none border-none bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-ink-muted hover:text-accent-dark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          {preparing ? "Preparing…" : file ? file.name : "Add a photo or video"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        <button
          type="submit"
          disabled={pending || preparing || (!text.trim() && !file)}
          className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper-raised transition hover:bg-accent-dark disabled:opacity-40"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}
