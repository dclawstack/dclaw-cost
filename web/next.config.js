/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy all /api/* requests server-side to the FastAPI backend.
  // The browser only ever sees same-origin requests — no CORS, no baked-in URL.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8122";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/health/:path*",
        destination: `${backendUrl}/health/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
