"use client";

import { useRef, useState, useTransition } from "react";
import { createEntry } from "@/app/(app)/entry/actions";
import { NAMED_RECIPIENT_GROUPS } from "@/lib/seal";

const MAX_RECORD_SECONDS = 600; // 10 min, per brief §4.2

type Format = "text" | "video" | "audio-record" | "audio-upload" | "photo";
type SealChoice = "OPEN" | "DATE" | "MANUAL" | "MILESTONE";

export function EntryForm({
  mode,
  promptId,
  promptText,
  familyMembers = [],
}: {
  mode: "prompted" | "memory";
  promptId?: string;
  promptText?: string;
  familyMembers?: { id: string; name: string }[];
}) {
  const [format, setFormat] = useState<Format>("text");
  const [content, setContent] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [audioUploadFile, setAudioUploadFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [recipientMode, setRecipientMode] = useState<"everyone" | "specific">("everyone");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [sealType, setSealType] = useState<SealChoice>("OPEN");
  const [unlockAt, setUnlockAt] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording(kind: "video" | "audio-record") {
    setError(null);
    setRecordedBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: kind === "video",
        audio: true,
      });
      streamRef.current = stream;
      if (kind === "video" && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        await videoPreviewRef.current.play().catch(() => {});
      }

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_RECORD_SECONDS) {
            stopRecording();
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Couldn't access the camera/microphone. Check your browser permissions and try again.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function handleSubmit() {
    setError(null);
    const formData = new FormData();
    formData.set("source", mode === "prompted" ? "PROMPTED" : "MEMORY");
    if (promptId) formData.set("promptId", promptId);

    if (format === "text") {
      if (!content.trim()) {
        setError("Write something first.");
        return;
      }
      formData.set("type", "TEXT");
      formData.set("content", content);
    } else if (format === "photo") {
      if (photoFiles.length === 0) {
        setError("Add at least one photo.");
        return;
      }
      formData.set("type", "PHOTO");
      formData.set("content", content);
      photoFiles.forEach((f) => formData.append("files", f));
    } else if (format === "audio-upload") {
      if (!audioUploadFile) {
        setError("Choose an audio file first.");
        return;
      }
      formData.set("type", "AUDIO");
      formData.set("content", content);
      formData.append("files", audioUploadFile);
    } else {
      // video or audio-record
      if (!recordedBlob) {
        setError("Record something first.");
        return;
      }
      formData.set("type", format === "video" ? "VIDEO" : "AUDIO");
      formData.set("content", content);
      const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      formData.append("files", new File([recordedBlob], `recording.${ext}`, { type: recordedBlob.type }));
    }

    if (recipientMode === "everyone") {
      formData.set("recipients", "EVERYONE");
    } else {
      if (recipientIds.length === 0) {
        setError("Pick at least one person, or switch back to Everyone.");
        return;
      }
      formData.set("recipients", recipientIds.join(","));
    }

    formData.set("sealType", sealType);
    if (sealType === "DATE") {
      if (!unlockAt) {
        setError("Pick an unlock date.");
        return;
      }
      formData.set("unlockAt", unlockAt);
    }
    if (sealType === "MILESTONE") {
      if (!milestoneDescription.trim()) {
        setError("Describe the milestone that unlocks this.");
        return;
      }
      formData.set("milestoneDescription", milestoneDescription.trim());
    }

    startTransition(() => {
      createEntry(formData);
    });
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {mode === "prompted" && promptText && (
        <div className="mb-6 rounded-xl bg-ink px-5 py-4 text-paper-raised">
          <p className="text-xs uppercase tracking-[0.15em] text-accent-soft">Today&apos;s question</p>
          <p className="mt-1 font-display text-lg italic">{promptText}</p>
        </div>
      )}
      {mode === "memory" && (
        <div className="mb-6">
          <h1 className="font-display text-xl font-semibold text-ink">Log a Memory</h1>
          <p className="text-ink-muted">Whatever&apos;s happening right now — no question required.</p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["text", "Write"],
            ["video", "Record video"],
            ["audio-record", "Record audio"],
            ["audio-upload", "Upload audio"],
            ["photo", "Photo"],
          ] as [Format, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setFormat(value);
              setError(null);
              setRecordedBlob(null);
            }}
            className={`rounded-full px-4 py-2 text-sm transition ${
              format === value ? "bg-accent-dark text-paper-raised" : "bg-accent-soft text-accent-dark hover:bg-accent-soft/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(format === "video" || format === "audio-record") && (
        <div className="mb-4 rounded-xl border border-border bg-paper-raised p-4">
          {format === "video" && <video ref={videoPreviewRef} muted playsInline className="mb-3 w-full rounded-lg bg-black" />}
          {isRecording ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-accent-dark">
                ● Recording — {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} / 10:00
              </span>
              <button type="button" onClick={stopRecording} className="rounded-full bg-accent-dark px-4 py-2 text-sm text-paper-raised">
                Stop
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startRecording(format === "video" ? "video" : "audio-record")}
              className="rounded-full bg-ink px-4 py-2 text-sm text-paper-raised hover:bg-accent-dark"
            >
              {recordedBlob ? "Re-record" : "Start recording"}
            </button>
          )}
          {recordedBlob && !isRecording && (
            <p className="mt-2 text-sm text-accent-dark">Recording captured — ready to save.</p>
          )}
        </div>
      )}

      {format === "photo" && (
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-ink-muted"
          />
          {photoFiles.length > 0 && <p className="mt-1 text-sm text-ink-muted">{photoFiles.length} photo(s) selected</p>}
        </div>
      )}

      {format === "audio-upload" && (
        <div className="mb-4">
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioUploadFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-muted"
          />
        </div>
      )}

      <textarea
        placeholder={format === "text" ? "Tell it however you want…" : "Add a caption or note (optional)"}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={format === "text" ? 8 : 3}
        className="w-full rounded-lg border border-border bg-paper-raised p-4 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />

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
        {pending ? "Saving…" : "Save entry"}
      </button>
    </div>
  );
}
