/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* → BE (cùng site, cookie SameSite=Lax)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
