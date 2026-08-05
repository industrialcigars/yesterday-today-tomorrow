import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getActivePromptForUser } from "@/lib/prompts";
import { prisma } from "@/lib/db";
import { EntryForm } from "@/components/EntryForm";
import { Role } from "@/app/generated/prisma/enums";

export default async function NewEntryPage() {
  const user = await getCurrentUser();

  // The curated question bank is Dad's mechanism — everyone else contributes
  // their own entries via Log a Memory instead (see brief §3 roles table).
  if (user && user.role !== Role.OWNER) {
    redirect("/memory");
  }

  const [prompt, familyMembers] = await Promise.all([
    user ? getActivePromptForUser(user.id) : null,
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!prompt) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-center text-ink-muted">
        You&apos;ve answered every question in the bank right now — nice work. New ones will show up here as they&apos;re added.
      </div>
    );
  }

  return <EntryForm mode="prompted" promptId={prompt.id} promptText={prompt.text} familyMembers={familyMembers} />;
}
