"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadMedia } from "@/lib/storage";
import { transcribeMedia } from "@/lib/transcribe";
import { generateTitleAndSummary, deriveFallbackTitle } from "@/lib/summarize";
import { notifyForEntry } from "@/lib/notify";
import { EntrySource, EntryType, SealType } from "@/app/generated/prisma/enums";

export async function createEntry(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const type = formData.get("type") as string;
  const source = (formData.get("source") as string) === "PROMPTED" ? EntrySource.PROMPTED : EntrySource.MEMORY;
  const content = ((formData.get("content") as string) || "").trim() || null;
  const promptId = (formData.get("promptId") as string) || null;

  if (!Object.values(EntryType).includes(type as EntryType)) {
    throw new Error("Invalid entry type");
  }

  const entry = await prisma.entry.create({
    data: {
      authorId: user.id,
      type: type as EntryType,
      source,
      content,
      promptId: promptId || undefined,
    },
  });

  const recipients = ((formData.get("recipients") as string) || "").trim();
  if (recipients && recipients !== "EVERYONE") {
    const ids = recipients.split(",").filter(Boolean);
    await prisma.recipient.createMany({ data: ids.map((userId) => ({ entryId: entry.id, userId })) });
  } else if (recipients === "EVERYONE") {
    await prisma.recipient.create({ data: { entryId: entry.id, freeText: "Everyone" } });
  }

  const sealType = (formData.get("sealType") as string) || "OPEN";
  if (Object.values(SealType).includes(sealType as SealType) && sealType !== SealType.OPEN) {
    const unlockAtRaw = formData.get("unlockAt") as string;
    const milestoneDescription = (formData.get("milestoneDescription") as string) || null;
    await prisma.sealRule.create({
      data: {
        entryId: entry.id,
        type: sealType as SealType,
        unlockAt: sealType === SealType.DATE && unlockAtRaw ? new Date(unlockAtRaw) : null,
        milestoneDescription: sealType === SealType.MILESTONE ? milestoneDescription : null,
      },
    });
  }

  const sharedStorageKey = (formData.get("sharedStorageKey") as string) || null;
  let transcript: string | null = null;

  if (sharedStorageKey) {
    // Already uploaded by the share-target handler (Instagram/Facebook
    // share-to-app flow) — just attach it, no transcript for this path.
    const sharedMediaType = (formData.get("sharedMediaType") as string) || "application/octet-stream";
    await prisma.media.create({
      data: { entryId: entry.id, storageKey: sharedStorageKey, type: sharedMediaType },
    });
  } else {
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const key = `entries/${entry.id}/${randomUUID()}.${ext}`;
      const { storageKey } = await uploadMedia(key, buffer, file.type || "application/octet-stream");
      await prisma.media.create({
        data: {
          entryId: entry.id,
          storageKey,
          type: file.type || "application/octet-stream",
          size: file.size,
        },
      });

      if ((type === EntryType.VIDEO || type === EntryType.AUDIO) && !transcript) {
        transcript = await transcribeMedia(buffer, file.name, file.type);
      }
    }
  }

  const textForSummary = content || transcript || "";
  const generated = textForSummary ? await generateTitleAndSummary(textForSummary) : null;
  const title = generated?.title ?? deriveFallbackTitle(textForSummary, type);

  await prisma.entry.update({
    where: { id: entry.id },
    data: {
      transcript,
      title,
      summary: generated?.summary,
    },
  });

  await notifyForEntry(entry.id);

  redirect("/timeline");
}
