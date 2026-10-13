/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: 'standalone',
  transpilePackages: ["@react-pdf/renderer"],
  webpack: (config, { isServer }) => {

    if (isServer) {
      config.externals = [...(config.externals || []), "@react-pdf/renderer"];
    }
    return config;
  },

  images: {
    dangerouslyAllowSVG: true,

    dangerouslyAllowLocalIP: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
