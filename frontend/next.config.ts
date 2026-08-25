import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Wikipedia (DigiLocker logo etc.)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
  async rewrites() {
    // In development, proxy /api/backend to the local FastAPI backend.
    // In production, the apiFetch helper uses NEXT_PUBLIC_API_BASE_URL
    // which should point to the deployed backend URL.
    // If NEXT_PUBLIC_API_BASE_URL is not set in production, the frontend
    // will try /api/backend which won't have a rewrite target — the
    // backend must be separately deployed and accessible.
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
