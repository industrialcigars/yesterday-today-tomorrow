import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function transcribeMedia(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string | null> {
  if (!client) return null;
  try {
    const file = new File([new Uint8Array(buffer)], filename, { type: mimeType });
    const result = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });
    return result.text;
  } catch (err) {
    console.error("Transcription failed:", err);
    return null;
  }
}
