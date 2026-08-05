import { prisma } from "@/lib/db";
import { Role } from "@/app/generated/prisma/enums";

// Dave's launch-day welcome sequence should play until he's actually posted
// something — no separate flag needed, "has he ever written an entry" is
// the source of truth and self-heals if he closes the tab mid-sequence.
export async function needsWelcome(user: { id: string; role: Role }): Promise<boolean> {
  if (user.role !== Role.OWNER) return false;
  const count = await prisma.entry.count({ where: { authorId: user.id } });
  return count === 0;
}
