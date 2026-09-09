import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  ...(process.env.NEXT_PUBLIC_STATIC_EXPORT === "1" ? {
    output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/demo",
    trailingSlash: true,
    images: { unoptimized: true },
  } : {}),
  outputFileTracingIncludes: {
    "/api/regulations": ["./data/regulations/**/*.json"],
  },
};
export default config;
