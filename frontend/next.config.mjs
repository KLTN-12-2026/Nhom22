/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Proxy /api/* -> BE ngoại trừ các module Đợt 2 đang trong quá trình bàn giao (practice, notebook, confusing-pairs, statistics)
  async rewrites() {
    return [
      {
        source: '/api/v1/practice/:path*',
        destination: '/api/v1/practice/:path*',
      },
      {
        source: '/api/v1/notebook/:path*',
        destination: '/api/v1/notebook/:path*',
      },
      {
        source: '/api/v1/learning/confusing-pairs',
        destination: '/api/v1/learning/confusing-pairs',
      },
      {
        source: '/api/v1/statistics/:path*',
        destination: '/api/v1/statistics/:path*',
      },
      {
        source: '/api/:path*',
        destination: `${(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
