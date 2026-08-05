// The very first question Dave answers, live, on launch day (brief §2).
// Kept separate from the general rotation in lib/prompts.ts so it never
// gets served as a regular "today's question" — the welcome flow looks it
// up by this exact text instead.
export const LAUNCH_PROMPT_TEXT =
  "Today's your 65th birthday — what does this next phase of life look like for you?";
export const LAUNCH_PROMPT_CATEGORY = "Milestone";
