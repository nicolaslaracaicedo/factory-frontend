import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? apiUrl,
  },
  turbopack: {
    root: process.cwd(),
  },
  // Movido a la raíz del objeto
  allowedDevOrigins: ['192.168.1.224', 'localhost'],
};

export default nextConfig;