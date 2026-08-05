import { prisma } from "@/lib/db";
import { PromptOrigin, PromptStatus } from "@/app/generated/prisma/enums";

// Selection priority per brief §4.10: curated bank first, then family-submitted, then AI-generated.
const ORIGIN_PRIORITY = [PromptOrigin.CURATED, PromptOrigin.FAMILY, PromptOrigin.AI];

export async function getActivePromptForUser(userId: string) {
  const answeredPromptIds = (
    await prisma.entry.findMany({
      where: { authorId: userId, promptId: { not: null } },
      select: { promptId: true },
    })
  ).map((e) => e.promptId as string);

  for (const origin of ORIGIN_PRIORITY) {
    const prompt = await prisma.prompt.findFirst({
      where: {
        status: PromptStatus.ACTIVE,
        origin,
        id: { notIn: answeredPromptIds },
      },
      orderBy: { createdAt: "asc" },
    });
    if (prompt) return prompt;
  }
  return null;
}
