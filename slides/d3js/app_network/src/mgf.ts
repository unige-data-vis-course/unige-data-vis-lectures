import type { Spectrum, Peak } from "./types";

/**
 * Parse one BEGIN IONS / END IONS block (its lines) into a `Spectrum`.
 *
 * Session 1 claimed an MGF file is "just text": a few `KEY=VALUE` header
 * lines, then one `m/z intensity` line per peak. This is the proof. Session 3
 * adds two header lines we care about: `SEQ=` (the identified peptide) and
 * `SCANS=` (a stable id).
 */
function parseBlock(lines: string[], fallbackId: string): Spectrum {
  let id = fallbackId;
  let title = "";
  let peptide: string | undefined;
  let precursorMz = 0;
  let charge = 1;
  const peaks: Peak[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // skip blank lines, comments, and the block markers
    if (line === "" || line.startsWith("#")) continue;
    if (line === "BEGIN IONS" || line === "END IONS") continue;

    // header lines: KEY=VALUE
    if (line.startsWith("TITLE=")) { title = line.slice("TITLE=".length); continue; }
    if (line.startsWith("SEQ=")) { peptide = line.slice("SEQ=".length); continue; }
    if (line.startsWith("SCANS=")) { id = line.slice("SCANS=".length); continue; }
    if (line.startsWith("PEPMASS=")) {
      // PEPMASS may carry an optional intensity after the m/z — take the first number
      precursorMz = parseFloat(line.slice("PEPMASS=".length));
      continue;
    }
    if (line.startsWith("CHARGE=")) {
      charge = parseInt(line.slice("CHARGE=".length), 10) || 1;
      continue;
    }
    if (line.includes("=")) continue; // any other header line we do not use

    // everything else is a peak line: "m/z  intensity"
    const parts = line.split(/\s+/);
    const mz = Number(parts[0]);
    const intensity = Number(parts[1]);
    if (Number.isFinite(mz) && Number.isFinite(intensity)) {
      peaks.push({ mz, intensity });
    }
  }

  // keep peaks sorted by m/z — every downstream step is easier this way
  peaks.sort((a, b) => a.mz - b.mz);

  return { id, title: title || id, peptide, precursorMz, charge, peaks };
}

/** Parse a single-spectrum `.mgf` file. (Sessions 1-2.) */
export function parseMgf(text: string): Spectrum {
  return parseBlock(text.split(/\r?\n/), "spectrum");
}

/**
 * Parse a multi-spectrum `.mgf` file into an array of `Spectrum`. (Session 3.)
 *
 * Each spectrum is one BEGIN IONS / END IONS block. We walk the lines, collect
 * each block, and hand it to `parseBlock`. Same "it's just text" idea — only
 * now there is more than one record in the file.
 */
export function parseMgfMany(text: string): Spectrum[] {
  const spectra: Spectrum[] = [];
  let current: string[] | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "BEGIN IONS") {
      current = [];
      continue;
    }
    if (line === "END IONS") {
      if (current) {
        spectra.push(parseBlock(current, `spectrum-${spectra.length + 1}`));
      }
      current = null;
      continue;
    }
    if (current) current.push(rawLine);
  }

  return spectra;
}
