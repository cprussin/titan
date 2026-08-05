/** @type {import("next").NextConfig} */
const nextConfig = {
  // No ESLint in this repo — Biome is the linter, run via turbo `test:lint`.
  eslint: { ignoreDuringBuilds: true },
  // The monorepo uses TypeScript 7 (the native compiler), which does not yet
  // expose the JS compiler API that Next's bundled type-check used to load. This
  // flag makes Next shell out to the project-local `tsc` CLI, which supports TS 7.
  experimental: { useTypeScriptCli: true },
  // The @titan/* workspace packages ship TypeScript source, so Next must
  // transpile them rather than expecting pre-built JS.
  transpilePackages: [
    "@titan/adaptation-engine",
    "@titan/component-library",
    "@titan/concept2",
    "@titan/db",
    "@titan/domain",
    "@titan/program-engine",
    "@titan/programs",
  ],
};

export default nextConfig;
