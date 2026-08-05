"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PromptStatus, Role } from "@/app/generated/prisma/enums";

async function assertReviewer() {
  const user = await getCurrentUser();
  if (!user || (user.role !== Role.OWNER && user.role !== Role.ADMIN)) {
    throw new Error("Not authorized");
  }
}

export async function approvePrompt(promptId: string) {
  await assertReviewer();
  await prisma.prompt.update({ where: { id: promptId }, data: { status: PromptStatus.ACTIVE } });
  revalidatePath("/review");
}

export async function dismissPrompt(promptId: string) {
  await assertReviewer();
  await prisma.prompt.update({ where: { id: promptId }, data: { status: PromptStatus.RETIRED } });
  revalidatePath("/review");
}
