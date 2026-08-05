import Link from "next/link";
import { prisma } from "@/lib/db";
import { getMediaUrl } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { ViewTabs } from "@/components/ViewTabs";
import { isEntryUnlocked, canManageEntry } from "@/lib/seal";

export default async function GalleryPage() {
  const [user, media] = await Promise.all([
    getCurrentUser(),
    prisma.media.findMany({
      where: {
        OR: [{ type: { startsWith: "image/" } }, { type: { startsWith: "video/" } }],
      },
      orderBy: { createdAt: "desc" },
      include: { entry: { select: { id: true, title: true, authorId: true, sealRule: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <ViewTabs active="gallery" />

      {media.length === 0 ? (
        <div className="py-16 text-center text-ink-muted">
          No photos or videos in the archive yet — they&apos;ll show up here as entries come in.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {media.map((m) => {
            const unlocked = isEntryUnlocked(m.entry.sealRule);
            const canPeek = canManageEntry(m.entry.authorId, user);
            if (!unlocked && !canPeek) {
              return (
                <div
                  key={m.id}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-paper-raised px-3 text-center"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-faint">
                    <rect x="5" y="11" width="14" height="9" rx="1.5" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  <span className="text-xs text-ink-faint">Sealed</span>
                </div>
              );
            }
            return (
              <Link
                key={m.id}
                href={`/entry/${m.entry.id}`}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-paper-raised"
              >
                {m.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getMediaUrl(m.storageKey)}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:opacity-90"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-ink px-3 text-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-xs text-white/70">Video</span>
                  </div>
                )}
                {!unlocked && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] text-paper-raised">Sealed</span>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6">
                  <p className="line-clamp-2 text-xs font-medium text-white">{m.entry.title ?? "A memory"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
