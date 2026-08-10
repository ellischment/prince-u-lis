import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Без standalone в образ пришлось бы класть весь node_modules.
  // Dockerfile копирует .next/standalone, см. ARCHITECTURE.md раздел 2a.
  output: "standalone",
};

export default nextConfig;
