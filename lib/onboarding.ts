import { prisma } from "@/lib/db";

// Everyone's welcome sequence plays until they've actually posted something —
// no separate flag needed, "have they ever written an entry" is the source
// of truth and self-heals if they close the tab mid-sequence. Dave gets the
// launch-day version; everyone else gets the generic family-archive intro
// (see app/welcome/page.tsx).
export async function needsWelcome(user: { id: string }): Promise<boolean> {
  const count = await prisma.entry.count({ where: { authorId: user.id } });
  return count === 0;
}
