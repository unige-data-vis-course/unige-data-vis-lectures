import "./style.css";
import { parseMgf } from "./mgf";
import { matchPeptide } from "./match";
import { renderSpectrum } from "./spectrumChart";
import type { Peptide } from "./types";

// Vite's `?raw` suffix imports a file's contents as a string — so the spectrum
// travels with the app and there is no fetch to worry about.
import mgfText from "./data/example-spectrum.mgf?raw";

// The candidate peptide for this spectrum — Session 2's worked example.
const peptide: Peptide = { sequence: "LVNELTEFAK" };

// --------------------------------------------------------------------------
//  THE EXERCISE KNOB
//  Change this value, save, and watch the annotations (and the count in the
//  page footer) shift. How small can you make it before good matches drop?
//  How large before nonsense creeps in?
// --------------------------------------------------------------------------
const TOLERANCE_DA = 0.02;

// Wire the pieces together: text -> Spectrum -> Annotations -> picture.
const spectrum = parseMgf(mgfText);
const annotations = matchPeptide(spectrum, peptide, TOLERANCE_DA);

const chart = document.querySelector<HTMLDivElement>("#chart");
if (chart) {
  renderSpectrum(chart, spectrum, annotations, peptide);
}

const status = document.querySelector<HTMLParagraphElement>("#status");
if (status) {
  status.textContent =
    `${peptide.sequence} — matched ${annotations.length} of ` +
    `${spectrum.peaks.length} peaks (tolerance ±${TOLERANCE_DA} Da)`;
}
