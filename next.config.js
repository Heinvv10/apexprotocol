/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'pg'],
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
