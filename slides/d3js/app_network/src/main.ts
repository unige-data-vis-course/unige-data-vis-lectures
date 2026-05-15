import "./style.css";
import { fetchSpectra } from "./api";
import {
  computeSimilarities,
  graphFromSimilarities,
  type SimilarityRecord,
} from "./network";
import { renderNetwork } from "./networkChart";
import { matchPeptide } from "./match";
import { renderSpectrum } from "./spectrumChart";
import type { Spectrum, Peptide } from "./types";

// --------------------------------------------------------------------------
//  THE EXERCISE KNOBS
//
//  Initial values; the threshold also has a live slider in the page. Lower
//  the threshold and clusters merge / bridges appear; raise it and clusters
//  fragment.
// --------------------------------------------------------------------------
const INITIAL_THRESHOLD = 0.55;
const TOLERANCE_DA = 0.02; // Session 2 knob — annotation tolerance for the detail view

const networkEl = document.querySelector<HTMLDivElement>("#network")!;
const detailEl = document.querySelector<HTMLDivElement>("#detail")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const thresholdInput = document.querySelector<HTMLInputElement>("#threshold")!;
const thresholdLabel = document.querySelector<HTMLSpanElement>("#threshold-value")!;

let spectraCache: Spectrum[] = [];
let similarities: SimilarityRecord[] = [];

/** Show one spectrum in the detail panel — reuses the Session 2 component. */
function showSpectrum(spectrum: Spectrum): void {
  const peptide: Peptide = { sequence: spectrum.peptide ?? "" };
  const annotations = spectrum.peptide
    ? matchPeptide(spectrum, peptide, TOLERANCE_DA)
    : [];
  renderSpectrum(detailEl, spectrum, annotations, peptide);
}

/** Threshold the cached similarities and re-render the network. Cheap. */
function rerenderNetwork(threshold: number): void {
  const graph = graphFromSimilarities(spectraCache, similarities, threshold);
  renderNetwork(networkEl, graph, { onSelect: showSpectrum });
  statusEl.textContent =
    `${spectraCache.length} spectra · ${graph.links.length} similarity edges ` +
    `at threshold ${threshold.toFixed(2)} · click a node to inspect its spectrum`;
}

async function main(): Promise<void> {
  statusEl.textContent = "Loading spectra from the data service…";
  try {
    spectraCache = await fetchSpectra();
    statusEl.textContent = `Computing pairwise cosines for ${spectraCache.length} spectra…`;
    // O(N²) — runs once on load, ~tens of ms for a few hundred spectra
    similarities = computeSimilarities(spectraCache);

    // initial render with the default threshold
    thresholdInput.value = String(INITIAL_THRESHOLD);
    thresholdLabel.textContent = INITIAL_THRESHOLD.toFixed(2);
    rerenderNetwork(INITIAL_THRESHOLD);
    if (spectraCache.length > 0) showSpectrum(spectraCache[0]);

    // wire the slider: filter the cached similarities, do NOT recompute them
    thresholdInput.addEventListener("input", () => {
      const value = parseFloat(thresholdInput.value);
      thresholdLabel.textContent = value.toFixed(2);
      rerenderNetwork(value);
    });
  } catch (error) {
    statusEl.textContent =
      "Could not reach the data service. Start it with `npm start` in " +
      "data-service/, or run `docker compose up` from slides/d3js/.";
    console.error(error);
  }
}

main();
