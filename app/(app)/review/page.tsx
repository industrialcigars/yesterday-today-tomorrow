import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PromptStatus, Role } from "@/app/generated/prisma/enums";
import { approvePrompt, dismissPrompt } from "./actions";

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
        Questions the family has sent in. Approve to add them to the rotation, or dismiss the ones that aren&apos;t a fit.
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
              <div className="mt-3 flex gap-2">
                <form action={approvePrompt.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper-raised transition hover:bg-accent-dark"
                  >
                    Approve
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
