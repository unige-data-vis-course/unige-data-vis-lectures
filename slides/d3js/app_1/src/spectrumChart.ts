import * as d3 from "d3";
import type { Spectrum, Annotation, Peptide, Peak } from "./types";

/** Colours, shared with the slide theme (themes/unige.css). */
const COLOR = {
  unmatched: "#9aa1ac",
  b: "#2c5aa0", // b-ions (N-terminal) — navy-blue
  y: "#cf0063", // y-ions (C-terminal) — UniGE pink
  axis: "#4a4a4a",
  navy: "#1f3a5f",
};

/**
 * Render an annotated tandem mass spectrum into `container`.
 *
 * This is the module's first real, reusable component — Session 3 will call it
 * again (click a node in the spectrum network, see its spectrum here).
 *
 * What to notice, mapped back to Session 1:
 *   - the margin convention (an inner <g>, translated inward)  — same as the slides
 *   - d3.scaleLinear()  — the x() / y() you wrote by hand, now given to you
 *   - the y-flip  — done simply by passing the range as [plotH, 0]
 *   - selection.data().join()  — the .map() you wrote by hand, now reactive
 */
export function renderSpectrum(
  container: HTMLElement,
  spectrum: Spectrum,
  annotations: Annotation[],
  peptide: Peptide,
): void {
  // ---- 1. dimensions + the margin convention ----
  const width = 900;
  const height = 440;
  const margin = { top: 84, right: 24, bottom: 52, left: 66 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // which annotation, if any, belongs to a given peak (reference lookup)
  const annotationOf = new Map<Peak, Annotation>(
    annotations.map((a) => [a.peak, a]),
  );

  // ---- 2. scales: d3.scaleLinear() is the x() / y() of Session 1 ----
  const maxMz = d3.max(spectrum.peaks, (p) => p.mz) ?? 1000;
  const maxIntensity = d3.max(spectrum.peaks, (p) => p.intensity) ?? 1;

  const x = d3.scaleLinear().domain([0, maxMz * 1.04]).range([0, plotW]);
  // the y-flip is just a reversed range — D3 does it for us
  const y = d3.scaleLinear().domain([0, maxIntensity]).range([plotH, 0]);

  // ---- 3. a fresh SVG canvas + the inner <g> ----
  d3.select(container).selectAll("*").remove(); // clear, so re-renders stay clean

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // ---- 4. axes: ticks and labels, for free ----
  g.append("g")
    .attr("transform", `translate(0,${plotH})`)
    .call(d3.axisBottom(x));
  g.append("text")
    .attr("x", plotW / 2)
    .attr("y", plotH + 42)
    .attr("text-anchor", "middle")
    .attr("fill", COLOR.axis)
    .text("m/z");

  g.append("g").call(d3.axisLeft(y).ticks(5));
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -plotH / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("fill", COLOR.axis)
    .text("intensity");

  // ---- 5. the peaks: the data-join — one peak, one <line> ----
  const peakLines = g
    .append("g")
    .selectAll("line")
    .data(spectrum.peaks)
    .join("line")
    .attr("x1", (p) => x(p.mz))
    .attr("x2", (p) => x(p.mz))
    .attr("y1", y(0))
    .attr("y2", (p) => y(p.intensity))
    .attr("stroke", (p) => {
      const a = annotationOf.get(p);
      return a ? COLOR[a.ion.series] : COLOR.unmatched;
    })
    .attr("stroke-width", (p) => (annotationOf.get(p) ? 2.4 : 1.1));

  // a native hover tooltip on each peak
  peakLines.append("title").text((p) => {
    const a = annotationOf.get(p);
    const base = `m/z ${p.mz.toFixed(4)} · intensity ${p.intensity}`;
    return a ? `${a.ion.series}${a.ion.index}  —  ${base}` : base;
  });

  // ---- 6. labels on the matched peaks: "b2", "y4", ... ----
  g.append("g")
    .selectAll("text")
    .data(annotations)
    .join("text")
    .attr("x", (a) => x(a.peak.mz))
    .attr("y", (a) => y(a.peak.intensity) - 6)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("font-weight", 600)
    .attr("fill", (a) => COLOR[a.ion.series])
    .text((a) => `${a.ion.series}${a.ion.index}`);

  // ---- 7. the peptide sequence + fragmentation ladder, above the plot ----
  drawSequenceLadder(svg, peptide, annotations, margin.left, 40, plotW);
}

/**
 * Draw the peptide sequence with a small mark at every backbone bond the
 * spectrum actually "saw": a blue mark when a b-ion matched, a pink mark when a
 * y-ion matched. Read across, and the marks are the evidence for the sequence.
 */
function drawSequenceLadder(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  peptide: Peptide,
  annotations: Annotation[],
  xLeft: number,
  yTop: number,
  plotW: number,
): void {
  const residues = [...peptide.sequence];
  const n = residues.length;
  const step = Math.min(46, plotW / n);

  // which cleavage positions were observed?
  const bSeen = new Set(
    annotations.filter((a) => a.ion.series === "b").map((a) => a.ion.index),
  );
  const ySeen = new Set(
    annotations.filter((a) => a.ion.series === "y").map((a) => a.ion.index),
  );

  const ladder = svg
    .append("g")
    .attr("transform", `translate(${xLeft},${yTop})`);

  residues.forEach((aa, i) => {
    const cx = i * step + step / 2;

    ladder
      .append("text")
      .attr("x", cx)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("font-size", 19)
      .attr("font-weight", 700)
      .attr("fill", COLOR.navy)
      .text(aa);

    // a cleavage sits between residue i and i+1: it produces b(i+1) counting
    // from the left, and y(n-1-i) counting from the right.
    if (i < n - 1) {
      const markX = cx + step / 2;
      if (bSeen.has(i + 1)) {
        ladder
          .append("path")
          .attr("d", `M${markX},-14 l0,9 l-7,0`)
          .attr("stroke", COLOR.b)
          .attr("stroke-width", 2)
          .attr("fill", "none");
      }
      if (ySeen.has(n - 1 - i)) {
        ladder
          .append("path")
          .attr("d", `M${markX},14 l0,-9 l7,0`)
          .attr("stroke", COLOR.y)
          .attr("stroke-width", 2)
          .attr("fill", "none");
      }
    }
  });
}
