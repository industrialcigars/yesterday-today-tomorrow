"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PromptOrigin, PromptStatus } from "@/app/generated/prisma/enums";

export async function suggestPrompt(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const text = ((formData.get("text") as string) || "").trim();
  const category = ((formData.get("category") as string) || "").trim() || "From the Family";
  if (!text) return;

  await prisma.prompt.create({
    data: {
      text,
      category,
      origin: PromptOrigin.FAMILY,
      status: PromptStatus.SUGGESTED,
      suggestedById: user.id,
    },
  });

  revalidatePath("/ask");
  revalidatePath("/review");
}
