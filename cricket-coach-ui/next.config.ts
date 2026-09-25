import type { NextConfig } from "next";
import path from "path";

const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com/gsi/client https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com;
  connect-src 'self' http://localhost:8888 http://127.0.0.1:8888 ws://localhost:8888 ws://127.0.0.1:8888 https://accounts.google.com/gsi/ https://apis.google.com;
  frame-src 'self' https://accounts.google.com/gsi/;
  media-src 'self' blob: data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: CSP_HEADER,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
