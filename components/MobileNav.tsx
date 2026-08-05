"use client";

import Link from "next/link";
import { useState } from "react";

type NavItem = { href: string; label: string; badge?: number };

export function MobileNav({ items, userName }: { items: NavItem[]; userName?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-14 z-40 border-b border-border bg-paper px-4 py-3 shadow-lg">
          <nav className="flex flex-col">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-md px-3 py-3 text-base text-ink hover:bg-accent-soft"
              >
                {item.label}
                {!!item.badge && (
                  <span className="rounded-full bg-accent-dark px-1.5 py-0.5 text-[10px] font-semibold leading-none text-paper-raised">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-border px-3 pt-3">
              <span className="text-sm text-ink-faint">{userName}</span>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="text-sm text-ink-faint hover:text-ink">
                  Sign out
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
