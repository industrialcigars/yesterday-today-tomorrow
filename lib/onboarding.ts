import { prisma } from "@/lib/db";

// The welcome sequence plays exactly once per account, tracked by
// User.welcomeSeenAt (set the moment /welcome first renders — see
// app/welcome/page.tsx). It intentionally does NOT depend on whether they
// ever finish answering the first prompt: installed PWAs get killed and
// relaunched constantly (especially on iOS), and start_url re-checks this on
// every launch — gating on "posted an entry" made the whole intro replay
// from step 1 every single time the app reopened before someone finished it.
export async function needsWelcome(user: { welcomeSeenAt?: Date | null }): Promise<boolean> {
  return !user.welcomeSeenAt;
}
