import { describeSeal, type SealRuleLike } from "@/lib/seal";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function SealedCard({
  authorName,
  createdAt,
  sealRule,
}: {
  authorName: string;
  createdAt: Date;
  sealRule: SealRuleLike;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-paper-raised p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-ink-faint">
        <span>
          {authorName} · {formatDate(createdAt)}
        </span>
        <span className="rounded-full bg-ink px-2 py-0.5 text-paper-raised">Sealed</span>
      </div>
      <p className="flex items-center gap-1.5 font-display text-base italic text-ink-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none">
          <rect x="5" y="11" width="14" height="9" rx="1.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        {describeSeal(sealRule)}
      </p>
    </div>
  );
}
