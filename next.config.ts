import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin Turbopack root so builds don't pick a parent folder when multiple lockfiles exist (e.g. on dev machines).
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
