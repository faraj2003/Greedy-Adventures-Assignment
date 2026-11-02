import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The agent checks that bundled media files exist; make sure they ship with the API functions.
  outputFileTracingIncludes: {
    "/api/chat": ["./public/demo/**/*"],
    "/api/knowledge": ["./public/demo/**/*"],
  },
};

export default nextConfig;
