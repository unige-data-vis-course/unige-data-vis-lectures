import type { Peptide, FragmentIon } from "./types";

/**
 * ===========================================================================
 *  This file is GIVEN to you. In Session 2 you only *use* `theoreticalFragments`
 *  — you do not need to derive the chemistry. (Session 3 will lean on it too.)
 * ===========================================================================
 *
 * The idea, in one sentence:
 *   A peptide is a chain that snaps at each peptide bond. The piece that keeps
 *   the N-terminus is a "b" ion; the piece that keeps the C-terminus is a "y"
 *   ion. The mass spectrometer weighs each piece — so we add a proton (and, for
 *   y-ions, a water) to turn a residue sum into an observable m/z.
 *
 * Reference: Roepstorff & Fohlman (1984), Biomed. Mass Spectrom. 11(11).
 */

/** Monoisotopic residue masses (Da). Cysteine is taken here as unmodified. */
const RESIDUE_MASS: Record<string, number> = {
  G: 57.02146, A: 71.03711, S: 87.03203, P: 97.05276, V: 99.06841,
  T: 101.04768, C: 103.00919, L: 113.08406, I: 113.08406, N: 114.04293,
  D: 115.02694, Q: 128.05858, K: 128.09496, E: 129.04259, M: 131.04049,
  H: 137.05891, F: 147.06841, R: 156.10111, Y: 163.06333, W: 186.07931,
};

const PROTON = 1.007276; // mass of a proton (Da)
const WATER = 18.010565; // mass of a water molecule (Da)

/**
 * Predict the singly-charged b- and y-ion ladder of a peptide.
 *
 *   b(i) = (sum of the first i residues) + proton
 *   y(i) = (sum of the last  i residues) + water + proton
 *
 * For a peptide of length n there are n-1 cleavage sites, so n-1 b-ions and
 * n-1 y-ions. (b(n) and y(n) would be the whole peptide — not a fragment.)
 */
export function theoreticalFragments(peptide: Peptide): FragmentIon[] {
  const residues = [...peptide.sequence].map((aa) => RESIDUE_MASS[aa] ?? 0);
  const n = residues.length;
  const ions: FragmentIon[] = [];

  // b-ions: a running sum from the N-terminus (left end)
  let bSum = 0;
  for (let i = 0; i < n - 1; i++) {
    bSum += residues[i];
    ions.push({ series: "b", index: i + 1, mz: bSum + PROTON });
  }

  // y-ions: a running sum from the C-terminus (right end)
  let ySum = 0;
  for (let i = 0; i < n - 1; i++) {
    ySum += residues[n - 1 - i];
    ions.push({ series: "y", index: i + 1, mz: ySum + WATER + PROTON });
  }

  return ions;
}
