import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/video-proxy/:path*',
          destination: 'http://127.0.0.1:8888/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
