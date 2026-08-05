import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const r2Configured =
  !!process.env.R2_ACCOUNT_ID &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_BUCKET_NAME;

const isProduction = process.env.NODE_ENV === "production";

function assertStorageConfigured() {
  if (isProduction && !r2Configured) {
    throw new Error("R2_* env vars are required in production — local-disk storage fallback is dev-only");
  }
}

let s3Client: S3Client | null = null;
function getClient() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return s3Client;
}

export async function uploadMedia(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<{ storageKey: string; url: string }> {
  assertStorageConfigured();
  if (r2Configured) {
    await getClient().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? "";
    return { storageKey: key, url: `${base}/${key}` };
  }

  // Dev-only fallback: local disk under public/uploads
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadsDir, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
  return { storageKey: key, url: `/uploads/${key}` };
}

export function getMediaUrl(storageKey: string): string {
  if (r2Configured) {
    const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? "";
    return `${base}/${storageKey}`;
  }
  return `/uploads/${storageKey}`;
}
