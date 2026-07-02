import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  // Automatische JSX-runtime (zoals Next) zodat componenttests geen expliciete React-import nodig hebben.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      // `server-only` gooit bij import buiten een RSC-context; in Node-tests is dat een no-op.
      "server-only": fileURLToPath(new URL("./test-shims/server-only.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: true,
  },
});
