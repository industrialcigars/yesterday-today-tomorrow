import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

const FALLBACK_LABEL: Record<string, string> = {
  TEXT: "A written memory",
  VIDEO: "A video memory",
  AUDIO: "An audio memory",
  PHOTO: "A photo memory",
  LINK: "A shared video",
};

// Used whenever Claude isn't configured (no ANTHROPIC_API_KEY) or the call
// fails — a snippet of the entry itself beats a literal "Untitled entry".
export function deriveFallbackTitle(text: string, entryType: string): string {
  const trimmed = text.trim();
  if (!trimmed) return FALLBACK_LABEL[entryType] ?? "A memory";
  const words = trimmed.split(/\s+/);
  const snippet = words.slice(0, 8).join(" ");
  return words.length > 8 ? `${snippet}…` : snippet;
}

export async function generateTitleAndSummary(
  content: string
): Promise<{ title: string; summary: string } | null> {
  if (!client || !content.trim()) return null;
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Give a short scannable title (max 8 words, no quotes) and a one-sentence summary for this memory-app journal entry. Reply with ONLY a JSON object, no markdown fences: {"title": "...", "summary": "..."}\n\nEntry:\n${content.slice(0, 6000)}`,
        },
      ],
    });
    const block = response.content[0];
    const text = block.type === "text" ? block.text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.title === "string" && typeof parsed.summary === "string") {
      return { title: parsed.title, summary: parsed.summary };
    }
    return null;
  } catch (err) {
    console.error("Title/summary generation failed:", err);
    return null;
  }
}
