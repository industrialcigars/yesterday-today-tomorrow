import { prisma } from "@/lib/db";
import { sendPushNotification } from "@/lib/push";
import { isEntryUnlocked } from "@/lib/seal";

// Who gets pushed when an entry is created:
//  - Recipients tagged "Everyone" (or untagged) -> the whole family.
//  - Recipients tagged to specific people (including named groups like
//    Frakesboys4, which resolve to individual Recipient rows at creation
//    time) -> just those people.
//  - Whoever originally asked the prompt this entry answers -> always,
//    even if the entry itself isn't tagged to them.
//  - The author is never notified of their own entry.
//  - Sealed-and-still-locked entries notify no one — the whole point of a
//    seal is that it doesn't leak, not even as a push preview. Notifying
//    on unlock is a possible follow-up, not built yet.
export async function notifyForEntry(entryId: string) {
  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: { author: true, prompt: true, recipients: true, sealRule: true },
  });
  if (!entry) return;
  if (!isEntryUnlocked(entry.sealRule)) return;

  const isEveryone = entry.recipients.length === 0 || entry.recipients.some((r) => r.freeText === "Everyone");
  const targetIds = new Set<string>();

  if (isEveryone) {
    const everyone = await prisma.user.findMany({ select: { id: true } });
    everyone.forEach((u) => targetIds.add(u.id));
  } else {
    entry.recipients.filter((r) => r.userId).forEach((r) => targetIds.add(r.userId as string));
  }

  if (entry.prompt?.suggestedById) targetIds.add(entry.prompt.suggestedById);

  targetIds.delete(entry.authorId);
  if (targetIds.size === 0) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: [...targetIds] } } });
  if (subscriptions.length === 0) return;

  const payload = {
    title: `${entry.author.name} added a new memory`,
    body: entry.title ?? "Tap to see what they shared.",
    url: `/entry/${entry.id}`,
  };

  const results = await Promise.all(subscriptions.map((sub) => sendPushNotification(sub, payload)));

  const gone = subscriptions.filter((_, i) => results[i].gone).map((s) => s.endpoint);
  if (gone.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: gone } } });
  }
}
