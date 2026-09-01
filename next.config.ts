import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which silently truncates any real phone photo/video
      // upload mid-stream ("Unexpected end of form"). Entries can carry
      // several full-res photos or a 10-minute video recording.
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
