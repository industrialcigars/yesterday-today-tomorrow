import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PromptStatus, Role } from "@/app/generated/prisma/enums";
import { approvePrompt, approveAndAnswerNow, dismissPrompt } from "./actions";

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== Role.OWNER && user.role !== Role.ADMIN)) {
    redirect("/timeline");
  }

  const pending = await prisma.prompt.findMany({
    where: { status: PromptStatus.SUGGESTED },
    orderBy: { createdAt: "asc" },
    include: { suggestedBy: true },
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-1 font-display text-xl font-semibold text-ink">Review Queue</h1>
      <p className="mb-4 text-sm text-ink-muted">
        Questions the family has sent in. Curated questions come first in rotation, so sending one to the queue means
        it may be a while before it comes up — answer it on the spot instead if you don&apos;t want to wait.
      </p>

      {pending.length === 0 ? (
        <div className="rounded-xl border border-border bg-paper-raised p-6 text-center text-ink-muted">Nothing waiting on you right now.</div>
      ) : (
        <ul className="space-y-3">
          {pending.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-paper-raised p-4">
              <p className="text-ink">{p.text}</p>
              <p className="mt-1 text-xs text-ink-faint">
                {p.category} · suggested by {p.suggestedBy?.name ?? "a family member"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.role === Role.OWNER && (
                  <form action={approveAndAnswerNow.bind(null, p.id)}>
                    <button
                      type="submit"
                      className="rounded-full bg-accent-dark px-4 py-1.5 text-sm font-medium text-paper-raised transition hover:bg-ink"
                    >
                      Answer now →
                    </button>
                  </form>
                )}
                <form action={approvePrompt.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper-raised transition hover:bg-accent-dark"
                  >
                    Send to the queue
                  </button>
                </form>
                <form action={dismissPrompt.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-border px-4 py-1.5 text-sm text-ink-muted hover:border-accent hover:text-accent-dark"
                  >
                    Dismiss
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
