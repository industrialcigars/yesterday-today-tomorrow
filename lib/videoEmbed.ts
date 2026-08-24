export type VideoEmbedInfo = {
  provider: "youtube" | "facebook" | "unknown";
  embedUrl: string | null;
};

// Best-effort — turns a YouTube/Facebook watch link into an embeddable
// iframe src. Anything else still saves fine, it just falls back to a plain
// "Watch original" link instead of an inline player.
export function getVideoEmbedInfo(rawUrl: string): VideoEmbedInfo {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { provider: "unknown", embedUrl: null };
  }

  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtube.com") {
    const id = url.searchParams.get("v");
    if (id) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
    const shorts = url.pathname.match(/^\/shorts\/([\w-]+)/);
    if (shorts) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${shorts[1]}` };
    const embed = url.pathname.match(/^\/embed\/([\w-]+)/);
    if (embed) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${embed[1]}` };
  }

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    if (id) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
  }

  if (host === "facebook.com" || host === "fb.watch") {
    return {
      provider: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(rawUrl)}&show_text=false`,
    };
  }

  return { provider: "unknown", embedUrl: null };
}
