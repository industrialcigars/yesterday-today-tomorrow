import { getVideoEmbedInfo } from "@/lib/videoEmbed";

export function VideoEmbed({ url }: { url: string }) {
  const { embedUrl } = getVideoEmbedInfo(url);

  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-paper px-3 py-2.5 text-sm font-medium text-accent-dark hover:border-accent"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6M10 14 21 3" />
        </svg>
        Watch the original link
      </a>
    );
  }

  return (
    <div className="relative mt-3 w-full overflow-hidden rounded-lg bg-black pt-[56.25%]">
      <iframe
        src={embedUrl}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
