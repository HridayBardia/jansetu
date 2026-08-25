import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In development, proxy /api/* to the local backend.
    // In production, the apiFetch helper in lib/api.ts constructs the
    // full backend URL (via NEXT_PUBLIC_API_BASE_URL or /api/backend proxy).
    // The backend middleware rewrites /api/backend -> /api/v1 internally.
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://127.0.0.1:8000/api/v1/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
