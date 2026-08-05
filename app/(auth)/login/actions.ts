"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { needsWelcome } from "@/lib/onboarding";

// Kids aren't on the "type your name" path yet — quick-pick buttons or a
// direct add are the only way in for them for now.
const GUEST_EXCLUDED_NAMES = ["Alessia", "Elias", "Leah", "Michaela"];

async function startSession(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const store = await cookies();
  store.set(SESSION_COOKIE, signSessionToken(user.id), sessionCookieOptions);

  redirect((await needsWelcome(user)) ? "/welcome" : "/timeline");
}

export async function chooseIdentity(userId: string) {
  await startSession(userId);
}

export async function chooseGuestByName(formData: FormData) {
  const name = ((formData.get("name") as string) || "").trim();
  if (!name) {
    redirect("/login?error=guest_empty");
  }

  const user = await prisma.user.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      NOT: { name: { in: GUEST_EXCLUDED_NAMES } },
    },
  });

  if (!user) {
    redirect("/login?error=guest_not_found");
  }

  await startSession(user.id);
}
