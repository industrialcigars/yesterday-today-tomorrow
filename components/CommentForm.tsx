"use client";

import { useRef, useState, useTransition } from "react";
import { addComment } from "@/app/(app)/entry/[id]/actions";
import { compressImageIfNeeded } from "@/lib/compressImage";

export function CommentForm({ entryId }: { entryId: string }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) {
      setFiles([]);
      return;
    }
    setPreparing(true);
    try {
      setFiles(await Promise.all(picked.map((f) => compressImageIfNeeded(f))));
    } finally {
      setPreparing(false);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    const formData = new FormData();
    formData.set("text", text);
    files.forEach((f) => formData.append("files", f));
    startTransition(async () => {
      await addComment(entryId, formData);
      setText("");
      setFiles([]);
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

      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-xs text-ink-muted">
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="flex-none text-ink-faint hover:text-accent-dark"
                aria-label={`Remove ${f.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-ink-muted hover:text-accent-dark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          {preparing ? "Preparing…" : files.length > 0 ? `${files.length} file(s) selected` : "Add photos or a video"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        <button
          type="submit"
          disabled={pending || preparing || (!text.trim() && files.length === 0)}
          className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper-raised transition hover:bg-accent-dark disabled:opacity-40"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}
