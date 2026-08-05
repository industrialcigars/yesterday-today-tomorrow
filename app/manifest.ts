import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yesterday, Today, Tomorrow",
    short_name: "YTT",
    description: "A living memory vault — his stories, his advice, his voice, in his own words.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e10600",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Lets installed devices offer this app in their native "Share to..."
    // sheet — e.g. sharing a photo straight out of Instagram or Facebook
    // lands on Log a Memory with it pre-attached. Android/Chrome support
    // this today; iOS Safari does not yet implement share_target, so it's a
    // silent no-op there until Apple ships it.
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [{ name: "files", accept: ["image/*", "video/*"] }],
      },
    },
  };
}
