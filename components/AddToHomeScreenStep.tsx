"use client";

import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

export function AddToHomeScreenStep({ onContinue, continueLabel }: { onContinue: () => void; continueLabel: string }) {
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-16">
      <div className="mx-auto max-w-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Keep it on your phone</p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-ink">Add it to your home screen</h2>
        <p className="mt-2 text-ink-muted">
          So it&apos;s one tap away, like any other app — and on iPhone, this is also required before push
          notifications will work at all.
        </p>

        <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-paper-raised p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="h-14 w-14 rounded-xl object-cover" />
          <div>
            <p className="font-medium text-ink">Yesterday, Today, Tomorrow</p>
            <p className="text-sm text-ink-faint">This is what you&apos;ll see on your home screen</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-ink">
          {platform === "ios" && (
            <>
              <Step n={1}>
                Tap the <strong>Share</strong> icon at the bottom of Safari (the square with an arrow).
              </Step>
              <Step n={2}>
                Scroll down and tap <strong>&ldquo;Add to Home Screen.&rdquo;</strong>
              </Step>
              <Step n={3}>Tap Add — you&apos;re done.</Step>
            </>
          )}
          {platform === "android" && (
            <>
              <Step n={1}>
                Tap the <strong>⋮</strong> menu in Chrome, top right.
              </Step>
              <Step n={2}>
                Tap <strong>&ldquo;Add to Home screen&rdquo;</strong> or <strong>&ldquo;Install app.&rdquo;</strong>
              </Step>
              <Step n={3}>Confirm — you&apos;re done.</Step>
            </>
          )}
          {platform === "other" && (
            <p className="text-sm text-ink-muted">
              Open this page on your phone&apos;s browser, then use its &ldquo;Add to Home Screen&rdquo; or
              &ldquo;Install&rdquo; option.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-8 w-full rounded-full bg-ink px-6 py-3 text-base font-medium text-paper-raised transition hover:bg-accent-dark"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-dark">
        {n}
      </span>
      <p className="text-sm">{children}</p>
    </div>
  );
}
