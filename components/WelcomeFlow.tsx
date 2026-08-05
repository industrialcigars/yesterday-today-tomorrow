"use client";

import { useState } from "react";
import { EntryForm } from "@/components/EntryForm";
import { AddToHomeScreenStep } from "@/components/AddToHomeScreenStep";

export function WelcomeFlow({
  userName,
  heroPhotoUrl,
  promptId,
  promptText,
}: {
  userName: string;
  heroPhotoUrl: string | null;
  promptId: string;
  promptText: string;
}) {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-paper">
      {step === 1 && (
        <div
          className="relative flex min-h-screen flex-col justify-end"
          style={
            heroPhotoUrl
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.9) 85%), url(${heroPhotoUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { background: "linear-gradient(180deg, #2a2a2a 0%, #0a0a0a 100%)" }
          }
        >
          <div className="px-6 pb-14 pt-24">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-soft">A living memory vault</p>
            <h1 className="mt-3 font-display text-4xl italic text-white">Welcome, {userName}.</h1>
            <p className="mt-3 max-w-sm text-white/80">This is yours now — happy 65th.</p>
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

      {step === 2 && (
        <div className="flex min-h-screen flex-col justify-center px-6 py-16">
          <div className="mx-auto max-w-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">What this is</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-ink">
              A place for your stories, your advice, your voice — all in your own words.
            </h2>
            <p className="mt-4 text-ink-muted">
              Answer a question whenever you want. Record it, write it, or just talk it out. The family adds their
              own memories right alongside yours, and it&apos;s built to keep growing for the next 20 or 30 years —
              not to look back, but to keep going.
            </p>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="mt-8 w-full rounded-full bg-ink px-6 py-3 text-base font-medium text-paper-raised transition hover:bg-accent-dark"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && <AddToHomeScreenStep onContinue={() => setStep(4)} continueLabel="Done — let's answer the first one" />}

      {step === 4 && (
        <div className="py-10">
          <p className="px-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-accent">
            One more thing before you go
          </p>
          <EntryForm mode="prompted" promptId={promptId} promptText={promptText} />
        </div>
      )}
    </div>
  );
}
