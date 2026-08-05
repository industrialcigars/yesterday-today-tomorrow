import { SealType } from "@/app/generated/prisma/enums";

export type SealRuleLike = {
  type: SealType;
  unlockAt: Date | null;
  unlockedAt: Date | null;
  milestoneDescription: string | null;
} | null;

export function isEntryUnlocked(sealRule: SealRuleLike): boolean {
  if (!sealRule || sealRule.type === SealType.OPEN) return true;
  if (sealRule.type === SealType.DATE) return !!sealRule.unlockAt && sealRule.unlockAt <= new Date();
  return !!sealRule.unlockedAt;
}

export function canManageEntry(authorId: string, user: { id: string; role: string } | null): boolean {
  if (!user) return false;
  return user.id === authorId || user.role === "ADMIN";
}

export function describeSeal(sealRule: SealRuleLike): string {
  if (!sealRule) return "";
  switch (sealRule.type) {
    case SealType.DATE:
      return sealRule.unlockAt
        ? `Sealed until ${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(sealRule.unlockAt)}`
        : "Sealed";
    case SealType.MILESTONE:
      return sealRule.milestoneDescription ? `Sealed until: ${sealRule.milestoneDescription}` : "Sealed until a milestone happens";
    case SealType.MANUAL:
      return "Sealed — will open when unlocked";
    default:
      return "";
  }
}

export const NAMED_RECIPIENT_GROUPS: { label: string; names: string[] }[] = [
  { label: "Frakesboys4", names: ["Dave", "Andrew", "Nathan", "Brandon"] },
];

type RecipientLike = { userId: string | null; freeText: string | null; user?: { name: string } | null };

export function describeRecipients(recipients: RecipientLike[]): string | null {
  if (recipients.length === 0) return null;
  if (recipients.some((r) => r.freeText === "Everyone")) return "Everyone";
  const names = recipients.map((r) => r.user?.name ?? r.freeText).filter((n): n is string => !!n);
  const group = NAMED_RECIPIENT_GROUPS.find((g) => g.names.length === names.length && g.names.every((n) => names.includes(n)));
  if (group) return `For ${group.label}`;
  return names.length ? `For ${names.join(", ")}` : null;
}
