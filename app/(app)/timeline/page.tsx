import Link from "next/link";
import { prisma } from "@/lib/db";
import { getMediaUrl } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { EntryType } from "@/app/generated/prisma/enums";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { ViewTabs } from "@/components/ViewTabs";
import { SealedCard } from "@/components/SealedCard";
import { isEntryUnlocked, canManageEntry, describeRecipients } from "@/lib/seal";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

async function getFeaturedEntry() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  const candidates = await prisma.entry.findMany({
    where: { createdAt: { lt: cutoff } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { author: true, prompt: true },
  });

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; person?: string }>;
}) {
  const { q, category, person } = await searchParams;
  const query = q?.trim();
  const hasFilters = !!(query || category || person);

  const [user, entries, featured, categories, authors] = await Promise.all([
    getCurrentUser(),
    prisma.entry.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { content: { contains: query, mode: "insensitive" } },
                  { title: { contains: query, mode: "insensitive" } },
                  { summary: { contains: query, mode: "insensitive" } },
                  { transcript: { contains: query, mode: "insensitive" } },
                  { prompt: { text: { contains: query, mode: "insensitive" } } },
                  { comments: { some: { text: { contains: query, mode: "insensitive" } } } },
                ],
              }
            : {},
          category ? { prompt: { category } } : {},
          person ? { authorId: person } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
        media: { where: { commentId: null } },
        prompt: true,
        sealRule: true,
        recipients: { include: { user: true } },
        _count: { select: { comments: true } },
      },
    }),
    hasFilters ? Promise.resolve(null) : getFeaturedEntry(),
    prisma.prompt.findMany({
      where: { entries: { some: {} } },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
    prisma.user.findMany({
      where: { entries: { some: {} } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <ViewTabs active="timeline" />

      <form action="/timeline" method="get" className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-paper-raised px-3 py-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none text-ink-faint">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search the archive — try “business advice” or “Beglije”"
          className="flex-1 border-none bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
        />
        {/* keep the other filters when searching */}
        <input type="hidden" name="category" value={category ?? ""} />
        <input type="hidden" name="person" value={person ?? ""} />
      </form>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <form action="/timeline" method="get" className="contents">
          <input type="hidden" name="q" value={query ?? ""} />
          <input type="hidden" name="person" value={person ?? ""} />
          <AutoSubmitSelect
            name="category"
            defaultValue={category}
            placeholder="All categories"
            options={categories.map((c) => ({ value: c.category, label: c.category }))}
            className="rounded-full border border-border bg-paper-raised px-3 py-1.5 text-sm text-ink-muted focus:border-accent focus:outline-none"
          />
        </form>
        <form action="/timeline" method="get" className="contents">
          <input type="hidden" name="q" value={query ?? ""} />
          <input type="hidden" name="category" value={category ?? ""} />
          <AutoSubmitSelect
            name="person"
            defaultValue={person}
            placeholder="Everyone"
            options={authors.map((a) => ({ value: a.id, label: a.name }))}
            className="rounded-full border border-border bg-paper-raised px-3 py-1.5 text-sm text-ink-muted focus:border-accent focus:outline-none"
          />
        </form>
        {hasFilters && (
          <Link href="/timeline" className="text-sm text-ink-faint hover:text-ink">
            Clear filters
          </Link>
        )}
      </div>

      {featured && (
        <Link
          href={`/entry/${featured.id}`}
          className="mb-5 block rounded-xl border border-accent-soft bg-paper-raised p-5 transition hover:border-accent"
        >
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-accent-dark">Featured — from the archive</p>
          {featured.prompt && (
            <h2 className="font-display text-lg italic text-ink">&ldquo;{featured.prompt.text}&rdquo;</h2>
          )}
          {!featured.prompt && featured.title && (
            <h2 className="font-display text-lg font-semibold text-ink">{featured.title}</h2>
          )}
          <p className="mt-1 text-sm text-ink-muted">
            {featured.author.name} · {formatDate(featured.createdAt)}
          </p>
        </Link>
      )}

      {entries.length === 0 ? (
        <div className="py-16 text-center text-ink-muted">
          {hasFilters ? "Nothing matches those filters." : "Nothing here yet. Answer today's question or log a memory to get started."}
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const unlocked = isEntryUnlocked(entry.sealRule);
            const canPeek = canManageEntry(entry.authorId, user);
            if (!unlocked && !canPeek) {
              return <SealedCard key={entry.id} authorName={entry.author.name} createdAt={entry.createdAt} sealRule={entry.sealRule} />;
            }
            const recipientLabel = describeRecipients(entry.recipients);
            return (
            <Link
              key={entry.id}
              href={`/entry/${entry.id}`}
              className="block rounded-xl border border-border bg-paper-raised p-4 shadow-[0_1px_2px_rgba(43,32,21,0.04)] transition hover:border-accent-soft"
            >
              <div className="mb-2 flex items-center justify-between text-xs text-ink-faint">
                <span>
                  {entry.author.name} · {formatDate(entry.createdAt)}
                  {entry.prompt && <> · {entry.prompt.category}</>}
                </span>
                <span className="flex items-center gap-1.5">
                  {!unlocked && (
                    <span className="rounded-full bg-ink px-2 py-0.5 text-paper-raised">Sealed · visible to you</span>
                  )}
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent-dark">
                    {entry.source === "MEMORY" ? "Memory" : "Answered"}
                  </span>
                </span>
              </div>

              {recipientLabel && <p className="mb-1 text-xs font-medium text-accent-dark">{recipientLabel}</p>}

              {entry.prompt && <p className="mb-2 font-display text-sm italic text-ink-muted">&ldquo;{entry.prompt.text}&rdquo;</p>}

              <h2 className="font-display text-lg font-semibold text-ink">{entry.title ?? "A memory"}</h2>
              {entry.summary && <p className="mt-1 text-ink-muted">{entry.summary}</p>}

              {entry.type === EntryType.TEXT && entry.content && (
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-ink">{entry.content}</p>
              )}

              {entry.type === EntryType.PHOTO && entry.media.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {entry.media.map((m) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={m.id} src={getMediaUrl(m.storageKey)} alt="" className="rounded-lg object-cover" />
                  ))}
                </div>
              )}

              {entry.type === EntryType.VIDEO && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-muted">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  Video entry — tap to watch
                </p>
              )}

              {entry.type === EntryType.AUDIO && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-muted">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
                  </svg>
                  Audio entry — tap to listen
                </p>
              )}

              {entry.type === EntryType.LINK && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-muted">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <path d="M15 3h6v6M10 14 21 3" />
                  </svg>
                  Linked video — tap to watch
                </p>
              )}

              {entry.content && entry.type !== EntryType.TEXT && (
                <p className="mt-3 line-clamp-2 text-ink">{entry.content}</p>
              )}

              {entry._count.comments > 0 && (
                <p className="mt-3 text-sm font-medium text-accent-dark">
                  {entry._count.comments} {entry._count.comments === 1 ? "memory" : "memories"} added →
                </p>
              )}
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
