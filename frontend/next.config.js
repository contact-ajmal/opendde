/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/og-image.png',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, immutable' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/screenshots/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400' },
      ],
    },
  ],
};

module.exports = nextConfig;
