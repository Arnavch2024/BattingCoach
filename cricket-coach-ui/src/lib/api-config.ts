// Centralized API and WebSocket URL configuration
// In local dev, falls back to localhost:8888. In Vercel, uses NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL.

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8888"
).replace(/\/+$/, "");

export const WS_BASE_URL = (
  process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8888/ws"
).replace(/\/+$/, "");
