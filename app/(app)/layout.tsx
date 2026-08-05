import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PromptStatus, Role } from "@/app/generated/prisma/enums";
import { MobileNav } from "@/components/MobileNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isOwner = user?.role === Role.OWNER;
  const isReviewer = user?.role === Role.OWNER || user?.role === Role.ADMIN;
  const pendingCount = isReviewer ? await prisma.prompt.count({ where: { status: PromptStatus.SUGGESTED } }) : 0;

  const navItems = [
    { href: "/timeline", label: "Timeline" },
    { href: "/ask", label: "Ask a Question" },
    { href: "/quotes", label: "Quote of the Dave" },
    ...(isReviewer ? [{ href: "/review", label: "Review", badge: pendingCount }] : []),
    { href: "/settings", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-paper px-4">
        <Link href="/timeline" className="flex items-center">
          <Image src="/brand/wordmark.png" alt="Yesterday, to Dave, and Tomorrow" width={40} height={40} className="h-10 w-10" priority />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-accent-soft hover:text-ink"
            >
              {item.label}
              {!!item.badge && (
                <span className="rounded-full bg-accent-dark px-1.5 py-0.5 text-[10px] font-semibold leading-none text-paper-raised">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-sm text-ink-faint">{user?.name}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="text-sm text-ink-faint hover:text-ink">
              Sign out
            </button>
          </form>
        </div>

        <MobileNav items={navItems} userName={user?.name} />
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around border-t border-border bg-paper-raised py-3 shadow-[0_-1px_6px_rgba(10,10,10,0.06)]">
        {isOwner ? (
          <>
            <Link
              href="/entry/new"
              className="rounded-full bg-accent-dark px-6 py-3 text-sm font-medium text-paper-raised transition hover:bg-ink"
            >
              Answer today&apos;s question
            </Link>
            <Link
              href="/memory"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-ink-muted transition hover:border-accent hover:text-accent-dark"
            >
              Log a Memory
            </Link>
          </>
        ) : (
          <Link
            href="/memory"
            className="rounded-full bg-accent-dark px-6 py-3 text-sm font-medium text-paper-raised transition hover:bg-ink"
          >
            Add a memory
          </Link>
        )}
      </nav>
    </div>
  );
}
