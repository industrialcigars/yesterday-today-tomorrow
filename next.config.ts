import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which silently truncates any real phone photo/video
      // upload mid-stream ("Unexpected end of form"). Entries can carry
      // several full-res photos or a 10-minute video recording.
      bodySizeLimit: "100mb",
    },
    // Separate from the above: proxy.ts runs on every route (see matcher),
    // and Next buffers the request body for it to read up to this limit
    // (default 10MB) before the Server Action ever sees it — a second,
    // independent ceiling that silently truncated anything over 10MB even
    // after raising bodySizeLimit above.
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
