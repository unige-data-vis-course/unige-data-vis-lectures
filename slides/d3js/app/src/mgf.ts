import type { Spectrum, Peak } from "./types";

/**
 * Parse the text of an `.mgf` file into a `Spectrum`.
 *
 * Session 1 claimed an MGF file is "just text": a few header lines, then one
 * `m/z intensity` line per peak, wrapped in BEGIN IONS / END IONS. This
 * function is the proof — it handles a single spectrum block, which is all we
 * need for this module.
 */
export function parseMgf(text: string): Spectrum {
  let title = "";
  let precursorMz = 0;
  let charge = 1;
  const peaks: Peak[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    // skip blank lines, comments, and the block markers
    if (line === "" || line.startsWith("#")) continue;
    if (line === "BEGIN IONS" || line === "END IONS") continue;

    // header lines: KEY=VALUE
    if (line.startsWith("TITLE=")) {
      title = line.slice("TITLE=".length);
      continue;
    }
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

  return { title, precursorMz, charge, peaks };
}
