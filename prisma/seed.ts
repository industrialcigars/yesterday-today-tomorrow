import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Role, PromptOrigin, PromptStatus } from "../app/generated/prisma/enums";
import { LAUNCH_PROMPT_TEXT, LAUNCH_PROMPT_CATEGORY } from "../lib/launchPrompt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// §4.3 — family list. Placeholder emails get swapped for real ones before launch.
const FAMILY: { name: string; email: string; role: Role }[] = [
  { name: "Dave", email: "frakesfamily928@gmail.com", role: Role.OWNER },
  { name: "Beglije", email: "TODO-beglije@example.com", role: Role.CONTRIBUTOR },
  { name: "Andrew", email: "TODO-andrew@example.com", role: Role.CONTRIBUTOR },
  { name: "Nathan", email: "TODO-nathan@example.com", role: Role.CONTRIBUTOR },
  { name: "Brandon", email: "brandon@industrialcigars.com", role: Role.ADMIN },
  { name: "Ale", email: "TODO-ale@example.com", role: Role.CONTRIBUTOR },
  { name: "Jackie", email: "TODO-jackie@example.com", role: Role.CONTRIBUTOR },
  { name: "Diana", email: "TODO-diana@example.com", role: Role.CONTRIBUTOR },
  { name: "Alessia", email: "TODO-alessia@example.com", role: Role.CONTRIBUTOR },
  { name: "Elias", email: "TODO-elias@example.com", role: Role.CONTRIBUTOR },
  { name: "Leah", email: "TODO-leah@example.com", role: Role.CONTRIBUTOR },
  { name: "Michaela", email: "TODO-michaela@example.com", role: Role.CONTRIBUTOR },
];

// §6.1-6.8 — starter question bank.
const PROMPTS: { category: string; text: string }[] = [
  // 6.1 Childhood & Roots
  { category: "Childhood & Roots", text: "What's your earliest clear memory?" },
  { category: "Childhood & Roots", text: "What did your own parents do that you swore you'd do differently — did you?" },
  { category: "Childhood & Roots", text: "What was your childhood house like? Walk me through it room by room." },
  { category: "Childhood & Roots", text: "Who was the most important adult in your life growing up, besides your parents?" },
  // 6.2 Turning Points
  { category: "Turning Points", text: "What's a decision that changed the entire direction of your life?" },
  { category: "Turning Points", text: "Tell me about a moment you were genuinely scared and had to act anyway." },
  { category: "Turning Points", text: "What's something you almost did but didn't — and how do you think about that now?" },
  { category: "Turning Points", text: "What's the closest you've come to starting over?" },
  // 6.3 Work & Building Things
  { category: "Work & Building Things", text: "What's the best piece of business advice you ever got, and who gave it to you?" },
  { category: "Work & Building Things", text: "What's a mistake in business/work that taught you more than any success did?" },
  { category: "Work & Building Things", text: "Describe a day early in your career you still think about." },
  { category: "Work & Building Things", text: "What do you know now about work that you wish someone had told you at 25?" },
  // 6.4 Love & Family
  { category: "Love & Family", text: "How did you know Beglije was the one?" },
  { category: "Love & Family", text: "What's a hard season in your marriage/relationship you got through, and how?" },
  { category: "Love & Family", text: "What surprised you most about becoming a parent?" },
  { category: "Love & Family", text: "What do you want each of your kids to know that you've never quite said out loud?" },
  // 6.5 For the Grandkids Specifically
  { category: "For the Grandkids", text: "What do you want your grandkids to know about who you were before you were \"Grandpie\"?" },
  { category: "For the Grandkids", text: "What's a piece of advice you'd give them at 18 that you couldn't have heard at 18 yourself?" },
  { category: "For the Grandkids", text: "What's something you hope never changes about them?" },
  // 6.6 Crazy Moments & Stories
  { category: "Crazy Moments & Stories", text: "What's the most reckless thing you did before you had kids?" },
  { category: "Crazy Moments & Stories", text: "What's a story people in this family tell about you that you want to set straight?" },
  { category: "Crazy Moments & Stories", text: "What's the funniest thing that ever happened to you that you can actually prove?" },
  // 6.7 Beliefs & Philosophy
  { category: "Beliefs & Philosophy", text: "What do you believe now that you didn't believe at 30?" },
  { category: "Beliefs & Philosophy", text: "What's something everyone around you believes that you don't?" },
  { category: "Beliefs & Philosophy", text: "What does \"a life well lived\" actually mean to you, specifically?" },
  // 6.8 Photo Prompts
  { category: "Photo Prompts", text: "Upload a photo from a trip you think about often — what happened?" },
  { category: "Photo Prompts", text: "Upload a photo of someone who isn't with us anymore — tell me about them." },
  { category: "Photo Prompts", text: "Upload the oldest photo you have of yourself — what do you remember about that day?" },
];

// §4.9 — seeded from the family's existing "Quote of the Dave" list.
const QUOTES: string[] = [
  "Don't fuck with me during avocado season",
  "I'm just getting some blood in my ass",
  "That's where men are men and sheep are nervous",
  "That linebacker got all up in his ass",
  "Hey, don't break my pussy chair",
  "Get you a kite... get you a lightning storm... that's a fucking party",
  "It's only weird the first time",
  "Look, I like her — she's cute, she wears skirts short enough — but she's too young to be in here",
  "Put a little mustard on that ball",
  "Ana couldn't find her ass with two hands and a helper",
  "Finally shit like a pet monkey",
  "Gotta get some blood in my ass",
  "Dip me in shit and call it a fudgesicle",
  "You can lead a horse to water but you cannot teach them to fish",
  "We got enough food here to kill an army",
  "I'm shocked you came from my nuts",
  "That kid is worth less than tits on a boar",
  "Quit fiddle-fuckin' around",
  "You know whatcha oughta do?",
  "Yeah, that guy is sitting in a rubber room right now",
  "My wife is unfortunately on the tail end of menopause — but it's like a tornado, eventually it'll hit the next house",
  "Fuck me runnin'",
  "I'm stiff as a carp",
  "Books are for suckers",
  "It's like golf — if it were easy they'd only sell you one ball",
  "I have an issue understanding how this affects the price of tea in China",
  "I can tell when Jim was here because the cattle are backed up to the fence",
  "I was wailing that guy in the nuts — \"bowling alley fight\"",
  "\"That. Is. Unacceptable. Not joking, get my car now.\" — Airport Valet",
  "Did you forget about Obama?",
  "It's like being attacked by a grizzly bear — you just wait till it's over",
  "The difference between transparency and an excuse is when it's delivered",
  "His ass would pucker so tight he'd shit spaghetti for a week",
  "I suggest he start wiping the fog off his glasses and start paying attention",
  "I might have to wipe and call that a shit",
];

async function main() {
  console.log("Seeding family users…");
  const userByName: Record<string, string> = {};
  for (const person of FAMILY) {
    // Login always lowercases the submitted email before matching — keep seed data in lockstep.
    const email = person.email.toLowerCase();
    const user = await prisma.user.upsert({
      where: { email },
      create: { name: person.name, email, role: person.role },
      update: { name: person.name, role: person.role },
    });
    userByName[person.name] = user.id;
  }

  console.log("Seeding question bank…");
  for (const prompt of PROMPTS) {
    const existing = await prisma.prompt.findFirst({ where: { text: prompt.text } });
    if (!existing) {
      await prisma.prompt.create({
        data: {
          category: prompt.category,
          text: prompt.text,
          status: PromptStatus.ACTIVE,
          origin: PromptOrigin.CURATED,
        },
      });
    }
  }

  console.log("Seeding launch-day prompt…");
  const launchExisting = await prisma.prompt.findFirst({ where: { text: LAUNCH_PROMPT_TEXT } });
  if (!launchExisting) {
    await prisma.prompt.create({
      data: {
        category: LAUNCH_PROMPT_CATEGORY,
        text: LAUNCH_PROMPT_TEXT,
        status: PromptStatus.ACTIVE,
        origin: PromptOrigin.CURATED,
      },
    });
  }

  console.log("Seeding Quote of the Dave…");
  for (const text of QUOTES) {
    const existing = await prisma.quote.findFirst({ where: { text } });
    if (!existing) {
      await prisma.quote.create({ data: { text } });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
