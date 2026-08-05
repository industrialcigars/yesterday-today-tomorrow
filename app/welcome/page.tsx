import { existsSync } from "fs";
import path from "path";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LAUNCH_PROMPT_TEXT } from "@/lib/launchPrompt";
import { WelcomeFlow } from "@/components/WelcomeFlow";
import { Role } from "@/app/generated/prisma/enums";

export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // This is Dave's launch-day moment specifically — everyone else just uses the app normally.
  if (user.role !== Role.OWNER) redirect("/timeline");

  const prompt = await prisma.prompt.findFirst({ where: { text: LAUNCH_PROMPT_TEXT } });
  const heroPhotoUrl = existsSync(path.join(process.cwd(), "public", "welcome", "dave-hero.jpg"))
    ? "/welcome/dave-hero.jpg"
    : null;

  return (
    <WelcomeFlow
      userName={user.name}
      heroPhotoUrl={heroPhotoUrl}
      promptId={prompt?.id ?? ""}
      promptText={prompt?.text ?? LAUNCH_PROMPT_TEXT}
    />
  );
}
