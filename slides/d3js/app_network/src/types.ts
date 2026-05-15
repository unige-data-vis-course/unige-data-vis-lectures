/**
 * The data model for the whole module.
 *
 * In Session 1 a spectrum was "just an array of (m/z, intensity) pairs". Here
 * we write that down as TypeScript types. A type is a contract: it says what
 * shape a value has, and the compiler holds every function to it. For a class
 * coming from Python, think of it as a label on the jar that the language
 * actually checks.
 *
 * Session 3 adds the network types at the bottom.
 */

import type { SimulationNodeDatum, SimulationLinkDatum } from "d3";

/** A single peak in a mass spectrum: an (m/z, intensity) pair. */
export interface Peak {
  mz: number;
  intensity: number;
}

/** One tandem mass spectrum — the data shape from Session 1, named. */
export interface Spectrum {
  /** stable identifier, taken from the MGF SCANS line */
  id: string;
  /** human-readable label, taken from the MGF TITLE line */
  title: string;
  /** the identified peptide sequence (the MGF SEQ= line), if known */
  peptide?: string;
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

/* ------------------------------------------------------------------------ *
 *  Session 3 — the spectrum-similarity network.
 * ------------------------------------------------------------------------ */

/**
 * A node in the network: one spectrum.
 * Extends d3's `SimulationNodeDatum`, so d3-force may write `x`, `y`, `vx`,
 * `vy` (and `fx`, `fy` while dragging) directly onto it during the layout.
 */
export interface SpectrumNode extends SimulationNodeDatum {
  id: string;
  spectrum: Spectrum;
}

/**
 * An edge: two spectra whose cosine similarity is above the threshold.
 * Extends d3's `SimulationLinkDatum`, so `source` / `target` may be either an
 * id string (as we build them) or a resolved `SpectrumNode` (after d3-force
 * wires the graph up).
 */
export interface SimilarityLink extends SimulationLinkDatum<SpectrumNode> {
  /** cosine similarity, 0..1 */
  weight: number;
}

/** The whole spectrum-similarity network. */
export interface SpectrumGraph {
  nodes: SpectrumNode[];
  links: SimilarityLink[];
}
