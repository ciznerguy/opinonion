import { defineConfig } from "vite";

// Builds the widget as an ES module entry (`widget.js`) plus lazily-loaded chunks
// (the screenshot library only downloads after authentication).
// CSS (Tailwind) is imported with `?inline` and injected into the Shadow DOM,
// so there is no global stylesheet that could leak into / out of the host page.
export default defineConfig({
  publicDir: "public",
  esbuild: { jsx: "automatic", jsxImportSource: "preact" },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    cssCodeSplit: false,
    minify: "esbuild",
    rollupOptions: {
      input: { widget: "src/widget/widget.ts" },
      preserveEntrySignatures: "strict",
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
