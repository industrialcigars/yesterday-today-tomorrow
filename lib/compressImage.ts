// Client-side only — modern phone photos routinely run 10-40MB+, which is
// slow or outright fails to upload on a weak connection (raised server-side
// body limits don't help if the transfer itself never finishes). Downscale
// and re-encode before it ever hits FormData so uploads stay fast and
// reliable regardless of connection quality.
export async function compressImageIfNeeded(
  file: File,
  { maxDimension = 2048, quality = 0.85, skipIfUnderBytes = 1_500_000 }: { maxDimension?: number; quality?: number; skipIfUnderBytes?: number } = {}
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size <= skipIfUnderBytes) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // HEIC/decoding hiccup or unsupported browser — ship the original rather
    // than block the entry entirely; the 100mb server-side limit is the
    // backstop for whatever gets through.
    return file;
  }
}
