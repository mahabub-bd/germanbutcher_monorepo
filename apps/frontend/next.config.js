const path = require("path");

// Try multiple paths for Turbopack
const monorepoRoot = "/run/media/mahabub/Projects/Projects/germanbutcher";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Disable build cache to prevent hanging build trace collection in Docker/CI
  experimental: {
    cacheHandler: null,
  },

  turbopack: {
    root: monorepoRoot,
  },

  // Transpile ESM packages
  transpilePackages: ["@react-pdf/renderer"],

  webpack: (config, { isServer }) => {
    // Handle ESM packages properly
    if (isServer) {
      config.externals = [...(config.externals || []), "@react-pdf/renderer"];
    }
    return config;
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

module.exports = nextConfig;
