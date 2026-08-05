import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageEntry } from "@/lib/seal";
import { EntryEditForm } from "@/components/EntryEditForm";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [entry, familyMembers] = await Promise.all([
    prisma.entry.findUnique({ where: { id }, include: { recipients: true, sealRule: true } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!entry) notFound();
  if (!canManageEntry(entry.authorId, user)) {
    redirect(`/entry/${id}`);
  }

  const isEveryone = entry.recipients.some((r) => r.freeText === "Everyone");
  const specificIds = entry.recipients.filter((r) => r.userId).map((r) => r.userId as string);

  return (
    <EntryEditForm
      entryId={entry.id}
      initialTitle={entry.title ?? ""}
      initialContent={entry.content ?? ""}
      familyMembers={familyMembers}
      initialRecipientMode={isEveryone || specificIds.length === 0 ? "everyone" : "specific"}
      initialRecipientIds={specificIds}
      initialSealType={entry.sealRule?.type ?? "OPEN"}
      initialUnlockAt={entry.sealRule?.unlockAt ?? null}
      initialMilestoneDescription={entry.sealRule?.milestoneDescription ?? ""}
    />
  );
}
