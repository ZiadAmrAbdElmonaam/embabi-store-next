/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'www.google.com',
      'drive.google.com',
      'lh3.googleusercontent.com',
      'mega.nz',
      'mega.io'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 