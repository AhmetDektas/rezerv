import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Allow any external image URL (HTTP + HTTPS)
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
    // Don't optimize external images to avoid proxy errors
    unoptimized: true,
  },
  transpilePackages: ['@rezerv/types', '@rezerv/utils'],
}

export default nextConfig
