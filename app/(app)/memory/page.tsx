import { prisma } from "@/lib/db";
import { EntryForm } from "@/components/EntryForm";

export default async function LogMemoryPage() {
  const familyMembers = await prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return <EntryForm mode="memory" familyMembers={familyMembers} />;
}
