"use client";

import { useState, useTransition } from "react";
import { updateEntry } from "@/app/(app)/entry/[id]/actions";
import { NAMED_RECIPIENT_GROUPS } from "@/lib/seal";

type SealChoice = "OPEN" | "DATE" | "MANUAL" | "MILESTONE";

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function EntryEditForm({
  entryId,
  initialTitle,
  initialContent,
  familyMembers,
  initialRecipientMode,
  initialRecipientIds,
  initialSealType,
  initialUnlockAt,
  initialMilestoneDescription,
}: {
  entryId: string;
  initialTitle: string;
  initialContent: string;
  familyMembers: { id: string; name: string }[];
  initialRecipientMode: "everyone" | "specific";
  initialRecipientIds: string[];
  initialSealType: SealChoice;
  initialUnlockAt: Date | null;
  initialMilestoneDescription: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [recipientMode, setRecipientMode] = useState<"everyone" | "specific">(initialRecipientMode);
  const [recipientIds, setRecipientIds] = useState<string[]>(initialRecipientIds);
  const [sealType, setSealType] = useState<SealChoice>(initialSealType);
  const [unlockAt, setUnlockAt] = useState(toDateInputValue(initialUnlockAt));
  const [milestoneDescription, setMilestoneDescription] = useState(initialMilestoneDescription);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);

    if (recipientMode === "specific" && recipientIds.length === 0) {
      setError("Pick at least one person, or switch back to Everyone.");
      return;
    }
    if (sealType === "DATE" && !unlockAt) {
      setError("Pick an unlock date.");
      return;
    }
    if (sealType === "MILESTONE" && !milestoneDescription.trim()) {
      setError("Describe the milestone that unlocks this.");
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    formData.set("recipients", recipientMode === "everyone" ? "EVERYONE" : recipientIds.join(","));
    formData.set("sealType", sealType);
    if (sealType === "DATE") formData.set("unlockAt", unlockAt);
    if (sealType === "MILESTONE") formData.set("milestoneDescription", milestoneDescription.trim());

    startTransition(() => {
      updateEntry(entryId, formData);
    });
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 font-display text-xl font-semibold text-ink">Edit entry</h1>

      <label className="mb-1 block text-sm font-medium text-ink-muted">Title</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        className="mb-4 w-full rounded-lg border border-border bg-paper-raised px-3 py-2 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />

      <label className="mb-1 block text-sm font-medium text-ink-muted">Text</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="w-full rounded-lg border border-border bg-paper-raised p-4 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <p className="mt-1 text-xs text-ink-faint">Photos, video, and audio can&apos;t be swapped out here — delete and re-post if the media needs to change.</p>

      {familyMembers.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-paper-raised p-4">
          <p className="text-sm font-medium text-ink">Who&apos;s this for?</p>
          <p className="text-xs text-ink-faint">Just a dedication — everyone in the family can still see it, this doesn&apos;t hide it.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRecipientMode("everyone")}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                recipientMode === "everyone" ? "bg-accent-dark text-paper-raised" : "bg-paper text-ink-muted hover:bg-accent-soft"
              }`}
            >
              Everyone
            </button>
            {NAMED_RECIPIENT_GROUPS.map((group) => {
              const groupIds = familyMembers.filter((m) => group.names.includes(m.name)).map((m) => m.id);
              if (groupIds.length === 0) return null;
              const selected =
                recipientMode === "specific" && groupIds.length === recipientIds.length && groupIds.every((id) => recipientIds.includes(id));
              return (
                <button
                  key={group.label}
                  type="button"
                  onClick={() => {
                    setRecipientMode("specific");
                    setRecipientIds(groupIds);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    selected ? "bg-accent-dark text-paper-raised" : "bg-paper text-ink-muted hover:bg-accent-soft"
                  }`}
                >
                  {group.label}
                </button>
              );
            })}
            {familyMembers.map((m) => {
              const selected = recipientMode === "specific" && recipientIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setRecipientMode("specific");
                    setRecipientIds((prev) => (prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]));
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    selected ? "bg-accent-dark text-paper-raised" : "bg-paper text-ink-muted hover:bg-accent-soft"
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-border bg-paper-raised p-4">
        <p className="text-sm font-medium text-ink">Seal it?</p>
        <p className="text-xs text-ink-faint">Keep this hidden until a date, until you unlock it yourself, or until a milestone happens.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["OPEN", "Open now"],
              ["DATE", "On a date"],
              ["MANUAL", "Until I unlock it"],
              ["MILESTONE", "Until a milestone"],
            ] as [SealChoice, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSealType(value)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                sealType === value ? "bg-accent-dark text-paper-raised" : "bg-paper text-ink-muted hover:bg-accent-soft"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {sealType === "DATE" && (
          <input
            type="date"
            value={unlockAt}
            onChange={(e) => setUnlockAt(e.target.value)}
            className="mt-3 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
        )}
        {sealType === "MILESTONE" && (
          <input
            type="text"
            placeholder="e.g. When Nathan graduates"
            value={milestoneDescription}
            onChange={(e) => setMilestoneDescription(e.target.value)}
            className="mt-3 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
        )}
      </div>

      {error && <p className="mt-3 text-sm text-accent-dark">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-ink px-4 py-3 text-base font-medium text-paper-raised transition hover:bg-accent-dark disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
