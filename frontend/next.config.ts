import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Only proxy API requests to local backend during development.
    // In production on Vercel, the apiFetch function constructs full URLs
    // (e.g., https://hostname/api/backend/...) and the vercel.json rewrites
    // route them to the backend service. The localhost proxy would fail
    // in production and cause HTTP 500 errors.
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
