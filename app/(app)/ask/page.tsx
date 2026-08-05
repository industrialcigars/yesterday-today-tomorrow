import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SuggestPromptForm } from "@/components/SuggestPromptForm";
import { isEntryUnlocked, describeSeal } from "@/lib/seal";

const STATUS_LABEL: Record<string, string> = {
  SUGGESTED: "Pending review",
  ACTIVE: "Approved — in rotation",
  RETIRED: "Not used",
};

export default async function AskPage() {
  const user = await getCurrentUser();
  const mine = user
    ? await prisma.prompt.findMany({
        where: { suggestedById: user.id },
        orderBy: { createdAt: "desc" },
        include: { entries: { orderBy: { createdAt: "desc" }, include: { sealRule: true } } },
      })
    : [];

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-1 font-display text-xl font-semibold text-ink">Ask a Question</h1>
      <p className="mb-4 text-sm text-ink-muted">
        The best questions are the ones only this family would think to ask. Send one in — Dave sees it before it goes live.
      </p>

      <SuggestPromptForm />

      {mine.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Your suggestions</h2>
          <ul className="space-y-2">
            {mine.map((p) => {
              const answer = p.entries[0];
              const answerUnlocked = answer ? isEntryUnlocked(answer.sealRule) : false;
              return (
                <li key={p.id} className="rounded-lg border border-border bg-paper-raised p-3">
                  <p className="text-ink">{p.text}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {p.category} · {STATUS_LABEL[p.status] ?? p.status}
                  </p>
                  {answer && (
                    <div className="mt-2 border-t border-border pt-2">
                      {answerUnlocked ? (
                        <Link href={`/entry/${answer.id}`} className="text-sm font-medium text-accent-dark hover:underline">
                          Dave answered this →
                        </Link>
                      ) : (
                        <p className="text-sm text-ink-faint">Dave answered this — {describeSeal(answer.sealRule).toLowerCase()}</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
