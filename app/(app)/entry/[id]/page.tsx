import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getMediaUrl } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { EntryType } from "@/app/generated/prisma/enums";
import { CommentForm } from "@/components/CommentForm";
import { DeleteEntryButton } from "@/components/DeleteEntryButton";
import { SealedCard } from "@/components/SealedCard";
import { VideoEmbed } from "@/components/VideoEmbed";
import { isEntryUnlocked, canManageEntry, describeRecipients } from "@/lib/seal";
import { unlockEntry } from "./actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const entry = await prisma.entry.findUnique({
    where: { id },
    include: {
      author: true,
      media: { where: { commentId: null } },
      prompt: true,
      sealRule: true,
      recipients: { include: { user: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: true, media: true },
      },
    },
  });

  if (!entry) notFound();

  const unlocked = isEntryUnlocked(entry.sealRule);
  const canManage = canManageEntry(entry.authorId, user);

  if (!unlocked && !canManage) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <Link href="/timeline" className="mb-4 inline-block text-sm text-ink-muted hover:text-ink">
          ← Back to Feed
        </Link>
        <SealedCard authorName={entry.author.name} createdAt={entry.createdAt} sealRule={entry.sealRule} />
      </div>
    );
  }

  const recipientLabel = describeRecipients(entry.recipients);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <Link href="/timeline" className="mb-4 inline-block text-sm text-ink-muted hover:text-ink">
        ← Back to Feed
      </Link>

      <article className="rounded-xl border border-border bg-paper-raised p-5">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-faint">
          <span>
            {entry.author.name} · {formatDate(entry.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            {!unlocked && <span className="rounded-full bg-ink px-2 py-0.5 text-paper-raised">Sealed · visible to you</span>}
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent-dark">
              {entry.source === "MEMORY" ? "Memory" : "Answered"}
            </span>
          </span>
        </div>

        {recipientLabel && <p className="mb-1 text-xs font-medium text-accent-dark">{recipientLabel}</p>}

        {entry.prompt && <p className="mb-2 font-display text-sm italic text-ink-muted">&ldquo;{entry.prompt.text}&rdquo;</p>}

        <h1 className="font-display text-xl font-semibold text-ink">{entry.title ?? "A memory"}</h1>
        {entry.summary && <p className="mt-1 text-ink-muted">{entry.summary}</p>}

        {entry.type === EntryType.TEXT && entry.content && (
          <p className="mt-3 whitespace-pre-wrap text-ink">{entry.content}</p>
        )}

        {entry.type === EntryType.PHOTO && entry.media.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {entry.media.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.id} src={getMediaUrl(m.storageKey)} alt="" className="rounded-lg object-cover" />
            ))}
          </div>
        )}

        {entry.type === EntryType.VIDEO &&
          entry.media.map((m) => (
            <video key={m.id} controls className="mt-3 w-full rounded-lg" src={getMediaUrl(m.storageKey)} />
          ))}

        {entry.type === EntryType.AUDIO &&
          entry.media.map((m) => (
            <audio key={m.id} controls className="mt-3 w-full" src={getMediaUrl(m.storageKey)} />
          ))}

        {entry.type === EntryType.LINK && entry.externalUrl && <VideoEmbed url={entry.externalUrl} />}

        {entry.content && entry.type !== EntryType.TEXT && <p className="mt-3 text-ink">{entry.content}</p>}

        {entry.transcript && (
          <details className="mt-3 text-sm text-ink-muted">
            <summary className="cursor-pointer">Transcript</summary>
            <p className="mt-2 whitespace-pre-wrap">{entry.transcript}</p>
          </details>
        )}

        {canManage && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Link
              href={`/entry/${entry.id}/edit`}
              className="rounded-full border border-border px-4 py-1.5 text-sm text-ink-muted transition hover:border-accent hover:text-accent-dark"
            >
              Edit
            </Link>
            <DeleteEntryButton entryId={entry.id} />
            {!unlocked && (entry.sealRule?.type === "MANUAL" || entry.sealRule?.type === "MILESTONE") && (
              <form action={unlockEntry.bind(null, entry.id)}>
                <button
                  type="submit"
                  className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper-raised transition hover:bg-accent-dark"
                >
                  {entry.sealRule.type === "MILESTONE" ? "This happened — unlock it" : "Unlock it"}
                </button>
              </form>
            )}
          </div>
        )}
      </article>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {entry.comments.length > 0
            ? `${entry.comments.length} ${entry.comments.length === 1 ? "memory" : "memories"} added`
            : "Add to this memory"}
        </h2>

        <div className="mb-4 space-y-3">
          {entry.comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-paper-raised p-3">
              <div className="mb-1 text-xs text-ink-faint">
                {c.author.name} · {formatDate(c.createdAt)}
              </div>
              {c.text && <p className="text-[15px] text-ink">{c.text}</p>}
              {c.media.map((m) =>
                m.type.startsWith("video/") ? (
                  <video key={m.id} controls className="mt-2 w-full rounded-lg" src={getMediaUrl(m.storageKey)} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={m.id} src={getMediaUrl(m.storageKey)} alt="" className="mt-2 max-h-80 rounded-lg object-cover" />
                )
              )}
            </div>
          ))}
        </div>

        <CommentForm entryId={entry.id} />
      </div>
    </div>
  );
}
