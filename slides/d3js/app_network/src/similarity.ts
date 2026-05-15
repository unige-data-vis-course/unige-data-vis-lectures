import type { Spectrum } from "./types";

/**
 * Cosine similarity between two spectra.
 *
 * The picture (Session 3's analogy): imagine each spectrum as an **arrow** in
 * a huge space where every m/z bin is its own axis. Two spectra that fragment
 * the same way point in nearly the same direction — a small angle between the
 * arrows — and the cosine of that angle is close to 1. Two unrelated molecules
 * point off in unrelated directions: cosine close to 0.
 *
 *     cos(a, b) = (a · b) / (|a| · |b|)
 *
 * Real peaks almost never land at exactly the same m/z, so we first **bin**
 * them: round each m/z down into a `binWidth`-wide bucket and sum the
 * intensities there. Binning turns each spectrum into a vector we can dot
 * together.
 */

/** Turn a spectrum into a binned intensity vector: a Map from bin index → summed intensity. */
export function binSpectrum(spectrum: Spectrum, binWidth = 1.0): Map<number, number> {
  const bins = new Map<number, number>();
  for (const peak of spectrum.peaks) {
    const bin = Math.floor(peak.mz / binWidth);
    bins.set(bin, (bins.get(bin) ?? 0) + peak.intensity);
  }
  return bins;
}

/** Cosine similarity (0..1) between two spectra. */
export function cosineSimilarity(a: Spectrum, b: Spectrum, binWidth = 1.0): number {
  const va = binSpectrum(a, binWidth);
  const vb = binSpectrum(b, binWidth);

  // dot product: only bins present in BOTH spectra contribute
  let dot = 0;
  for (const [bin, intensityA] of va) {
    const intensityB = vb.get(bin);
    if (intensityB !== undefined) dot += intensityA * intensityB;
  }

  // the lengths (norms) of the two arrows
  let normA = 0;
  for (const intensity of va.values()) normA += intensity * intensity;
  let normB = 0;
  for (const intensity of vb.values()) normB += intensity * intensity;

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
