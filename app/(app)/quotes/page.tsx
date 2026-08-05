import { prisma } from "@/lib/db";
import { QuoteForm } from "@/components/QuoteForm";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: { contributedBy: true },
  });

  const featured = quotes.length > 0 ? quotes[Math.floor(Math.random() * quotes.length)] : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-1 font-display text-xl font-semibold text-ink">Quote of the Dave</h1>
      <p className="mb-4 text-sm text-ink-muted">The running collection. No ceremony required.</p>

      {featured && (
        <div className="mb-6 rounded-xl bg-ink px-5 py-5 text-paper-raised">
          <p className="text-xs uppercase tracking-[0.15em] text-accent-soft">Overheard</p>
          <p className="mt-2 font-display text-lg italic">&ldquo;{featured.text}&rdquo;</p>
        </div>
      )}

      <QuoteForm />

      <ul className="space-y-3">
        {quotes.map((q) => (
          <li key={q.id} className="rounded-lg border border-border bg-paper-raised p-3">
            <p className="text-ink">&ldquo;{q.text}&rdquo;</p>
            {q.context && <p className="mt-1 text-sm text-ink-muted">{q.context}</p>}
            {q.contributedBy && <p className="mt-1 text-xs text-ink-faint">— caught by {q.contributedBy.name}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
