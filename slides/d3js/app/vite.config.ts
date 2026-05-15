import { defineConfig } from "vite";

// Vite needs no configuration for a project this size — its defaults handle
// TypeScript, ES modules, hot-reload, and the dev server out of the box.
// This file is here mostly so you know where configuration *would* go.
export default defineConfig({
  server: {
    open: true, // open the browser automatically on `npm run dev`
  },
});
