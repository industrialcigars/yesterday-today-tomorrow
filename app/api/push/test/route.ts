import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: user.id } });
  if (subscriptions.length === 0) {
    return NextResponse.json({ error: "No push subscription found — enable notifications first" }, { status: 400 });
  }

  const results = await Promise.all(
    subscriptions.map((sub) =>
      sendPushNotification(sub, {
        title: "Yesterday, Today, Tomorrow",
        body: "This is a test push — if you can see this, notifications are working.",
        url: "/timeline",
      })
    )
  );

  const gone = subscriptions.filter((_, i) => results[i].gone).map((s) => s.endpoint);
  if (gone.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: gone } } });
  }

  return NextResponse.json({ sent: results.filter((r) => r.ok).length });
}
