import { parseMgfMany } from "./mgf";
import type { Spectrum } from "./types";

/**
 * Where the spectra come from.
 *
 * In Sessions 1-2 the dataset was bundled into the app with Vite's `?raw`
 * import. Session 3 changes that: a separate **data service** serves the
 * spectra over HTTP. That separation is the whole point of the Docker step —
 * it is what lets `docker-compose` run the app and its data as two containers.
 *
 * The URL comes from a Vite env var when set, and otherwise defaults to the
 * data service's local port. The same default works for `npm run dev` and for
 * `docker compose up`, because in both cases the browser reaches the service
 * on localhost:8081.
 */
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";

/** Fetch and parse the spectra dataset from the data service. */
export async function fetchSpectra(): Promise<Spectrum[]> {
  const response = await fetch(`${API_URL}/spectra`);
  if (!response.ok) {
    throw new Error(`data service responded with status ${response.status}`);
  }
  const mgfText = await response.text();
  return parseMgfMany(mgfText);
}
