import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the workspace root so Next doesn't pick up a stray lockfile in $HOME.
  turbopack: { root: import.meta.dirname },
};

export default withPayload(nextConfig);
