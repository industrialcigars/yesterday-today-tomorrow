"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function addQuote(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const text = ((formData.get("text") as string) || "").trim();
  const context = ((formData.get("context") as string) || "").trim() || null;
  if (!text) return;

  await prisma.quote.create({
    data: { text, context, contributedById: user.id },
  });

  revalidatePath("/quotes");
}
