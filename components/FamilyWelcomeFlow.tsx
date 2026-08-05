"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToHomeScreenStep } from "@/components/AddToHomeScreenStep";

export function FamilyWelcomeFlow({ userName }: { userName: string }) {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-paper">
      {step === 1 && (
        <div className="relative flex min-h-screen flex-col justify-end bg-ink">
          <div className="px-6 pb-14 pt-24">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-soft">Welcome to the family archive</p>
            <h1 className="mt-3 font-display text-4xl italic text-white">Hey, {userName}.</h1>
            <p className="mt-3 max-w-sm text-white/80">
              This is where Dave&apos;s stories, advice, and voice live — in his own words, whenever he wants to add
              them. You get to add your own memories alongside his, comment, and watch it grow.
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-8 rounded-full bg-white px-6 py-3 text-base font-medium text-ink"
            >
              Let&apos;s go
            </button>
          </div>
        </div>
      )}

      {step === 2 && <AddToHomeScreenStep onContinue={() => setStep(3)} continueLabel="Continue" />}

      {step === 3 && (
        <div className="flex min-h-screen flex-col justify-center px-6 py-16">
          <div className="mx-auto max-w-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Last thing</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-ink">Turn on notifications</h2>
            <p className="mt-4 text-ink-muted">
              This is how you&apos;ll know the moment Dave answers a question — especially one you asked, or one
              tagged just for you. Takes one tap.
            </p>
            <Link
              href="/settings"
              className="mt-8 block w-full rounded-full bg-ink px-6 py-3 text-center text-base font-medium text-paper-raised transition hover:bg-accent-dark"
            >
              Go to Settings
            </Link>
            <Link href="/timeline" className="mt-4 block text-center text-sm text-ink-faint hover:text-ink">
              Skip for now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
