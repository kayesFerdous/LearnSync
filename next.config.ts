import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${(process.env.API_URL || 'http://localhost:8000').replace(/\/$/, '')}/:path*`,
      },
    ];
  },
};

export default nextConfig;
