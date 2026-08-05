import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { needsWelcome } from "@/lib/onboarding";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect((await needsWelcome(user)) ? "/welcome" : "/timeline");
}
