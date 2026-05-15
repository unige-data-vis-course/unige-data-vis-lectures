import type { Spectrum, SpectrumGraph, SpectrumNode, SimilarityLink } from "./types";
import { cosineSimilarity } from "./similarity";

/**
 * A single pre-computed pairwise cosine similarity. The full list of these is
 * the heavy work — O(N²) — so we compute it once and re-threshold cheaply.
 */
export interface SimilarityRecord {
  sourceId: string;
  targetId: string;
  weight: number;
}

/**
 * Compute every pairwise cosine similarity. This is the expensive step
 * (O(N²) on N spectra). Call it once and feed the result to
 * `graphFromSimilarities` repeatedly as the user drags the threshold.
 */
export function computeSimilarities(
  spectra: Spectrum[],
  binWidth = 1.0,
): SimilarityRecord[] {
  const records: SimilarityRecord[] = [];
  for (let i = 0; i < spectra.length; i++) {
    for (let j = i + 1; j < spectra.length; j++) {
      const weight = cosineSimilarity(spectra[i], spectra[j], binWidth);
      records.push({ sourceId: spectra[i].id, targetId: spectra[j].id, weight });
    }
  }
  return records;
}

/** Threshold the cached similarities into a renderable graph — cheap, fast. */
export function graphFromSimilarities(
  spectra: Spectrum[],
  similarities: SimilarityRecord[],
  threshold: number,
): SpectrumGraph {
  const nodes: SpectrumNode[] = spectra.map((spectrum) => ({
    id: spectrum.id,
    spectrum,
  }));

  const links: SimilarityLink[] = [];
  for (const rec of similarities) {
    if (rec.weight >= threshold) {
      links.push({ source: rec.sourceId, target: rec.targetId, weight: rec.weight });
    }
  }

  return { nodes, links };
}

/**
 * Build the spectrum-similarity network in one call.
 *
 * Convenient when you only need the graph once; for an interactive threshold
 * slider, call `computeSimilarities` once and `graphFromSimilarities` on every
 * change instead — that keeps the slider responsive at hundreds of spectra.
 *
 * This is what GNPS-style "molecular networking" does, and the picture it
 * produces is the force-directed layout from the graphs module — now driven by
 * real data instead of a toy graph.
 */
export function buildSimilarityGraph(
  spectra: Spectrum[],
  threshold = 0.5,
  binWidth = 1.0,
): SpectrumGraph {
  const similarities = computeSimilarities(spectra, binWidth);
  return graphFromSimilarities(spectra, similarities, threshold);
}
