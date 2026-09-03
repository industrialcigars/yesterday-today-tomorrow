"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadMedia } from "@/lib/storage";
import { transcribeMedia } from "@/lib/transcribe";
import { canManageEntry } from "@/lib/seal";
import { SealType } from "@/app/generated/prisma/enums";

async function requireManageableEntry(entryId: string) {
  const user = await getCurrentUser();
  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!user || !entry || !canManageEntry(entry.authorId, user)) {
    throw new Error("Not allowed to manage this entry.");
  }
  return { user, entry };
}

export async function updateEntry(entryId: string, formData: FormData) {
  await requireManageableEntry(entryId);

  const title = ((formData.get("title") as string) || "").trim() || null;
  const content = ((formData.get("content") as string) || "").trim() || null;

  await prisma.entry.update({ where: { id: entryId }, data: { title, content } });

  const recipients = ((formData.get("recipients") as string) || "").trim();
  await prisma.recipient.deleteMany({ where: { entryId } });
  if (recipients && recipients !== "EVERYONE") {
    const ids = recipients.split(",").filter(Boolean);
    if (ids.length > 0) {
      await prisma.recipient.createMany({ data: ids.map((userId) => ({ entryId, userId })) });
    }
  } else if (recipients === "EVERYONE") {
    await prisma.recipient.create({ data: { entryId, freeText: "Everyone" } });
  }

  const sealType = (formData.get("sealType") as string) || "OPEN";
  if (Object.values(SealType).includes(sealType as SealType) && sealType !== SealType.OPEN) {
    const unlockAtRaw = formData.get("unlockAt") as string;
    const milestoneDescription = (formData.get("milestoneDescription") as string) || null;
    await prisma.sealRule.upsert({
      where: { entryId },
      create: {
        entryId,
        type: sealType as SealType,
        unlockAt: sealType === SealType.DATE && unlockAtRaw ? new Date(unlockAtRaw) : null,
        milestoneDescription: sealType === SealType.MILESTONE ? milestoneDescription : null,
      },
      update: {
        type: sealType as SealType,
        unlockAt: sealType === SealType.DATE && unlockAtRaw ? new Date(unlockAtRaw) : null,
        milestoneDescription: sealType === SealType.MILESTONE ? milestoneDescription : null,
        unlockedAt: null,
      },
    });
  } else {
    await prisma.sealRule.deleteMany({ where: { entryId } });
  }

  revalidatePath(`/entry/${entryId}`);
  revalidatePath("/timeline");
  redirect(`/entry/${entryId}`);
}

export async function deleteEntry(entryId: string) {
  await requireManageableEntry(entryId);
  await prisma.entry.delete({ where: { id: entryId } });
  revalidatePath("/timeline");
  redirect("/timeline");
}

export async function unlockEntry(entryId: string) {
  await requireManageableEntry(entryId);
  await prisma.sealRule.update({ where: { entryId }, data: { unlockedAt: new Date() } });
  revalidatePath(`/entry/${entryId}`);
}

export async function addComment(entryId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const text = ((formData.get("text") as string) || "").trim() || null;
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (!text && files.length === 0) return;

  const comment = await prisma.comment.create({
    data: { entryId, authorId: user.id, text },
  });

  let transcript: string | null = null;

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const key = `entries/${entryId}/comments/${comment.id}/${randomUUID()}.${ext}`;
    const { storageKey } = await uploadMedia(key, buffer, file.type || "application/octet-stream");

    await prisma.media.create({
      data: {
        entryId,
        commentId: comment.id,
        storageKey,
        type: file.type || "application/octet-stream",
        size: file.size,
      },
    });

    if (!transcript && (file.type.startsWith("video/") || file.type.startsWith("audio/"))) {
      transcript = await transcribeMedia(buffer, file.name, file.type);
    }
  }

  if (transcript) {
    await prisma.comment.update({ where: { id: comment.id }, data: { text: text ?? transcript } });
  }

  revalidatePath(`/entry/${entryId}`);
}
