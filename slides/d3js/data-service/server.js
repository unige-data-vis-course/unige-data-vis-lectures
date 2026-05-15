// A tiny data service for the D3.js module app.
//
// It has ONE job: serve the spectra dataset over HTTP. No framework, no
// dependencies — just Node's built-in `http` module. In Session 3 the app
// fetches from here instead of bundling its own data, which is what lets us
// split the system into two containers with docker-compose.
//
//   GET /spectra   -> the multi-spectrum MGF text
//   GET /health    -> "ok"   (a liveness check)

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const spectraMgf = readFileSync(join(here, "spectra.mgf"), "utf-8");

const PORT = process.env.PORT ?? 8081;

createServer((req, res) => {
  // The app is served from a different origin (nginx on :8080, or Vite on
  // :5173), so the browser needs permission to read from this service.
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.url === "/spectra") {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(spectraMgf);
    return;
  }
  if (req.url === "/health") {
    res.end("ok");
    return;
  }
  res.statusCode = 404;
  res.end("not found");
}).listen(PORT, () => {
  console.log(`spectra data service listening on http://localhost:${PORT}`);
  console.log("  GET /spectra  -> the multi-spectrum MGF dataset");
});
