import type { NextConfig } from "next";

/**
 * Validate that required environment variables are present at build time.
 * In development without Supabase, the app will fall back to mock data —
 * these warnings are informational only and will not crash the build.
 */
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(
      `[config] Warning: ${envVar} is not set. ` +
        "The app will run with mock data. See .env.example for setup instructions."
    );
  }
}

const nextConfig: NextConfig = {
  /**
   * Expose public Supabase config to the browser.
   * SUPABASE_SERVICE_ROLE_KEY is intentionally server-only and NOT listed here.
   */
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },

  /**
   * Strict React mode for catching potential issues early.
   */
  reactStrictMode: true,

  /**
   * Enable experimental server actions (required for Next.js 14 form actions).
   */
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
