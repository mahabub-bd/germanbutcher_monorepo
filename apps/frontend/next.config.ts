import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Turbopack configuration for monorepo
  turbopack: {
    // Include the monorepo's hoisted pnpm dependencies in Turbopack's boundary.
    root: workspaceRoot,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "purepacbd.s3.ap-southeast-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "germanbutcher.s3.ap-southeast-1.amazonaws.com",
      },
    ],
    qualities: [70, 75, 85, 100],
  },
};

export default nextConfig;
