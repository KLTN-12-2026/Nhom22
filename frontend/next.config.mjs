/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Proxy /api/* → BE (cùng site, cookie SameSite=Lax)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
