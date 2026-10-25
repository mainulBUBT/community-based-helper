import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  devIndicators: false,
  // দুই ভাষার 404 (app/global-not-found.tsx) শুধু build এ; dev সার্ভারে এটা চালু থাকলে পেজ বারবার রিলোড হয় (Next 16 এর বাগ)
  experimental: { globalNotFound: process.env.NODE_ENV === "production" },
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
