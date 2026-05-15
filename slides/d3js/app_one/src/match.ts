import type { Spectrum, Peptide, Annotation } from "./types";
import { theoreticalFragments } from "./fragments";

/**
 * Match the observed peaks of a `Spectrum` against the theoretical b/y ions of
 * a candidate `Peptide`. A peak is annotated when it falls within
 * `toleranceDa` of a predicted fragment m/z; if several ions are in range, the
 * closest one wins.
 *
 * `toleranceDa` is the knob in this session's exercise:
 *   - make it larger  -> more (and sloppier) matches appear
 *   - make it smaller -> only clean matches survive
 *
 * 0.02 Da is a sensible default for the kind of high-resolution spectrum in
 * `data/example-spectrum.mgf`.
 */
export function matchPeptide(
  spectrum: Spectrum,
  peptide: Peptide,
  toleranceDa = 0.02,
): Annotation[] {
  const ions = theoreticalFragments(peptide);
  const annotations: Annotation[] = [];

  for (const peak of spectrum.peaks) {
    // find the theoretical ion closest to this peak, within tolerance
    let best: { ion: FragmentIonLike; errorDa: number } | null = null;

    for (const ion of ions) {
      const errorDa = peak.mz - ion.mz; // signed: observed minus theoretical
      if (Math.abs(errorDa) <= toleranceDa) {
        if (best === null || Math.abs(errorDa) < Math.abs(best.errorDa)) {
          best = { ion, errorDa };
        }
      }
    }

    if (best !== null) {
      annotations.push({ peak, ion: best.ion, errorDa: best.errorDa });
    }
  }

  return annotations;
}

// a tiny local alias so the `best` variable above reads cleanly
type FragmentIonLike = ReturnType<typeof theoreticalFragments>[number];
