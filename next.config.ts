import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @monaco-editor/react creates a Monaco model on mount; React Strict Mode's
  // dev-only double-invoke of effects (mount -> cleanup -> mount) races with
  // the TypeScript worker's model sync and throws "Could not find source
  // file: inmemory://model/N". Disable Strict Mode so the editor only mounts
  // once per navigation.
  reactStrictMode: false,
};

export default nextConfig;
