import Link from "next/link";

export function ViewTabs({ active }: { active: "timeline" | "gallery" }) {
  const tabs = [
    { key: "timeline", label: "Timeline", href: "/timeline" },
    { key: "gallery", label: "Gallery", href: "/gallery" },
  ] as const;

  return (
    <div className="mb-5 inline-flex rounded-full border border-border bg-paper-raised p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            active === tab.key ? "bg-ink text-paper-raised" : "text-ink-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
