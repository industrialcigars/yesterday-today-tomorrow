import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Runs from inside the Railway network (internal DATABASE_URL works),
// dumps every table to JSON, and uploads it into the same R2 bucket used
// for media, under a backups/ prefix so it never collides with real files.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const data: Record<string, unknown> = {
    users: await prisma.user.findMany(),
    pushSubscriptions: await prisma.pushSubscription.findMany(),
    prompts: await prisma.prompt.findMany(),
    entries: await prisma.entry.findMany(),
    comments: await prisma.comment.findMany(),
    recipients: await prisma.recipient.findMany(),
    media: await prisma.media.findMany(),
    sealRules: await prisma.sealRule.findMany(),
    notificationSchedules: await prisma.notificationSchedule.findMany(),
    messagesToDad: await prisma.messageToDad.findMany(),
    quotes: await prisma.quote.findMany(),
  };
  await prisma.$disconnect();

  const rowCounts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (v as unknown[]).length]));
  console.log("Row counts:", rowCounts);

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
  });

  const key = `backups/db-${new Date().toISOString().slice(0, 10)}.json`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    })
  );

  console.log("Uploaded backup to", key);
}

main().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
