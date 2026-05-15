/**
 * The data model for the whole module.
 *
 * In Session 1 a spectrum was "just an array of (m/z, intensity) pairs". Here
 * we write that down as TypeScript types. A type is a contract: it says what
 * shape a value has, and the compiler holds every function to it. For a class
 * coming from Python, think of it as a label on the jar that the language
 * actually checks.
 */

/** A single peak in a mass spectrum: an (m/z, intensity) pair. */
export interface Peak {
  mz: number;
  intensity: number;
}

/** One tandem mass spectrum — the data shape from Session 1, named. */
export interface Spectrum {
  /** human-readable label, taken from the MGF TITLE line */
  title: string;
  /** precursor m/z (the MGF PEPMASS line) */
  precursorMz: number;
  /** precursor charge (the MGF CHARGE line), e.g. 2 for "2+" */
  charge: number;
  peaks: Peak[];
}

/** A peptide is, for our purposes, just its amino-acid sequence. */
export interface Peptide {
  /** one-letter amino-acid codes, e.g. "LVNELTEFAK" */
  sequence: string;
}

/** A theoretical fragment ion predicted from a peptide. */
export interface FragmentIon {
  /** "b" = keeps the N-terminus, "y" = keeps the C-terminus */
  series: "b" | "y";
  /** position along the backbone, 1-based (b2, y3, ...) */
  index: number;
  /** theoretical m/z, singly charged */
  mz: number;
}

/** An observed peak that has been matched to a theoretical fragment ion. */
export interface Annotation {
  peak: Peak;
  ion: FragmentIon;
  /** signed mass error, observed minus theoretical, in daltons */
  errorDa: number;
}
