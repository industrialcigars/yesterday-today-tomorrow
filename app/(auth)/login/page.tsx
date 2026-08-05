import Image from "next/image";
import { prisma } from "@/lib/db";
import { chooseIdentity } from "./actions";
import { GuestEntry } from "@/components/GuestEntry";

const QUICK_PICK_NAMES = ["Dave", "Beglije", "Brandon", "Andrew", "Diana", "Nathan", "Jacky", "Ale"];

const ERROR_COPY: Record<string, string> = {
  guest_empty: "Type a name first.",
  guest_not_found: "That name's not on the family list yet — check the spelling, or ask Brandon to add you.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const users = await prisma.user.findMany({ where: { name: { in: QUICK_PICK_NAMES } } });
  const byName = new Map(users.map((u) => [u.name, u]));
  const quickPick = QUICK_PICK_NAMES.map((name) => byName.get(name)).filter((u): u is NonNullable<typeof u> => !!u);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <p className="text-center text-sm uppercase tracking-[0.2em] text-accent">A living memory vault</p>
        <Image
          src="/brand/wordmark.png"
          alt="Yesterday, to Dave, and Tomorrow"
          width={1254}
          height={1254}
          priority
          className="mx-auto mt-3 h-auto w-48"
        />
        <p className="mt-3 text-center text-ink-muted">Just for the family. Who&apos;s this?</p>

        {error && ERROR_COPY[error] && (
          <p className="mt-6 rounded-lg border border-accent-soft bg-accent-soft/60 px-4 py-3 text-sm text-accent-dark">
            {ERROR_COPY[error]}
          </p>
        )}

        <div className="mt-8 space-y-2">
          {quickPick.map((user) => (
            <form key={user.id} action={chooseIdentity.bind(null, user.id)}>
              <button
                type="submit"
                className="w-full rounded-lg border border-border bg-paper-raised px-4 py-3 text-left text-base font-medium text-ink transition hover:border-accent hover:bg-accent-soft"
              >
                {user.name}
              </button>
            </form>
          ))}
          <GuestEntry />
        </div>
      </div>
    </div>
  );
}
