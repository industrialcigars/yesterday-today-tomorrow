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
  };
}
