import { prisma } from "@/lib/db";
import { getMediaUrl } from "@/lib/storage";
import { EntryForm } from "@/components/EntryForm";

export default async function LogMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ sharedKey?: string; sharedType?: string; caption?: string }>;
}) {
  const { sharedKey, sharedType, caption } = await searchParams;
  const familyMembers = await prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  const sharedMedia = sharedKey && sharedType ? { url: getMediaUrl(sharedKey), storageKey: sharedKey, type: sharedType } : undefined;

  return <EntryForm mode="memory" familyMembers={familyMembers} sharedMedia={sharedMedia} initialCaption={caption} />;
}
