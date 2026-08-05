import { prisma } from "@/lib/db";
import { sendPushNotification } from "@/lib/push";

export async function notifyFamilyOfNewEntry(entry: {
  id: string;
  title: string | null;
  authorId: string;
  authorName: string;
}) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { not: entry.authorId } },
  });
  if (subscriptions.length === 0) return;

  const payload = {
    title: `${entry.authorName} added a new memory`,
    body: entry.title ?? "Tap to see what they shared.",
    url: `/entry/${entry.id}`,
  };

  const results = await Promise.all(subscriptions.map((sub) => sendPushNotification(sub, payload)));

  const gone = subscriptions.filter((_, i) => results[i].gone).map((s) => s.endpoint);
  if (gone.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: gone } } });
  }
}
