/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async rewrites() {
    return [
      {
        source: '/api/v1/practice/:path*',
        destination: '/api/v1/practice/:path*',
      },
      {
        source: '/api/v1/notebook/:id',
        destination: '/api/v1/notebook/:id',
      },
      {
        source: '/api/:path*',
        destination: `${(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/+$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
