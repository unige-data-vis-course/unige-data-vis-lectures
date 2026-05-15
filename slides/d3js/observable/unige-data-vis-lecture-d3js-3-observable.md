# Session 3 — Spectral similarity, networks, and the verification story (Observable HQ cells)

Paste each block below into its own cell on **observablehq.com**, in order.
Blocks marked *(Markdown)* are Markdown cells; the rest are JavaScript cells.

This notebook generates its own 12-spectrum dataset (4 BSA tryptic peptides ×
3 replicates each), so it is fully self-contained — no data service required.

Two parts:

- **Part 1 — worked example.** The dataset, the binning helper, and a quick
  look at what one spectrum becomes after binning. Sets up the intuition for
  Part 2.
- **Part 2 — exercise.** You write `cosineSimilarity`, and the
  spectrum-similarity **network** renders itself the moment your function
  works. Then explore the threshold slider.

---

## Cell 1 — Title *(Markdown)*

```md
# Spectral similarity, networks, and identity

Session 3 of the D3.js module · UniGE Data Visualisation.

We compute how alike every pair of spectra is, draw the result as a
**force-directed network**, and check whether the clusters agree with the
peptides we know each spectrum came from. The picture is the argument.
```

---

## Cell 2 — Part 1 header *(Markdown)*

```md
## Part 1 — Worked example: the data, and what binning does

A small in-silico BSA dataset, generated below from a fixed random seed. It
mixes three kinds of spectra on purpose:

- **fully tryptic** peptides (replicates → tight clusters),
- **a miscleaved peptide** (shares ions with two parents → a *bridge*),
- **a Met-oxidation variant** (same `SEQ=` → a *sub-cluster*).

So the network will not be four lonely cliques — and the threshold slider
will matter.
```

---

## Cell 3 — Import D3 *(JavaScript)*

```js
d3 = require("d3@7")
```

---

## Cell 4 — The peptides *(JavaScript)*

```js
PEPTIDES = ["LVNELTEFAK", "HLVDEPQNLIK", "YICDNQDTISSK", "DAFLGSFLYEYSR", "TVMENFVAFVDK"]
```

---

## Cell 5 — theoreticalFragments — GIVEN *(JavaScript)*

```js
// Same function as Session 2, plus an optional list of OXIDATION SITES (1-based
// residue positions). An oxidised residue adds +15.995 Da to every ion that
// contains it, which shifts roughly half of the b/y ladder away from the
// unmodified version — exactly enough to produce an intermediate cosine.
//   b(i) = (first i residues) + proton  (+ ox for each oxidised position covered)
//   y(i) = (last  i residues) + water + proton
theoreticalFragments = (sequence, oxidationSites = []) => {
  const RESIDUE = {
    G: 57.02146, A: 71.03711, S: 87.03203, P: 97.05276, V: 99.06841,
    T: 101.04768, C: 103.00919, L: 113.08406, I: 113.08406, N: 114.04293,
    D: 115.02694, Q: 128.05858, K: 128.09496, E: 129.04259, M: 131.04049,
    H: 137.05891, F: 147.06841, R: 156.10111, Y: 163.06333, W: 186.07931
  };
  const PROTON = 1.007276, WATER = 18.010565, OX = 15.99491;
  const ox = new Set(oxidationSites);
  const res = [...sequence].map(aa => RESIDUE[aa] ?? 0);
  const n = res.length;
  const ions = [];
  let bSum = 0, bOx = 0;
  for (let i = 0; i < n - 1; i++) {
    bSum += res[i];
    if (ox.has(i + 1)) bOx += OX;
    ions.push({ series: "b", index: i + 1, mz: bSum + bOx + PROTON });
  }
  let ySum = 0, yOx = 0;
  for (let i = 0; i < n - 1; i++) {
    ySum += res[n - 1 - i];
    if (ox.has(n - i)) yOx += OX;
    ions.push({ series: "y", index: i + 1, mz: ySum + yOx + WATER + PROTON });
  }
  return ions;
}
```

---

## Cell 6 — A seeded RNG so everyone sees the same dataset *(JavaScript)*

```js
// mulberry32 — a tiny seedable pseudo-random generator. The seed below makes
// the generated spectra deterministic across browsers and reloads.
rng = {
  let s = 0x9e3779b9;       // seed
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

---

## Cell 7 — Generate the dataset (with bridges and a sub-cluster) *(JavaScript)*

```js
spectra = {
  const out = [];
  let nextId = 1;

  // helper: turn a theoretical ion ladder into `count` noisy replicate spectra
  function replicate(ions, count, kind, seq) {
    const base = ions
      .filter(() => rng() < 0.82)
      .map(ion => ({ mz: ion.mz, intensity: 800 + rng() * 8200 }));
    if (base.length) base[Math.floor(rng() * base.length)].intensity = 10000;
    const mzMax = Math.max(...base.map(p => p.mz)) + 30;
    for (let r = 1; r <= count; r++) {
      const peaks = base
        .filter(() => rng() > 0.12)
        .map(p => ({ mz: p.mz, intensity: p.intensity * (0.72 + rng() * 0.56) }));
      const noise = 2 + Math.floor(rng() * 3);
      for (let i = 0; i < noise; i++) {
        peaks.push({ mz: 120 + rng() * mzMax, intensity: 200 + rng() * 1300 });
      }
      peaks.sort((a, b) => a.mz - b.mz);
      out.push({ id: `spec-${String(nextId++).padStart(3, "0")}`, peptide: seq, kind, peaks });
    }
  }

  // 1) fully tryptic peptides — 5 replicates each
  for (const seq of PEPTIDES) {
    replicate(theoreticalFragments(seq), 5, "tryptic", seq);
  }

  // 2) a "miscleaved" pseudo-peptide spanning two of the tryptic peptides:
  //    it shares b-ions with LVNELTEFAK and y-ions with HLVDEPQNLIK, so its
  //    spectra will sit BETWEEN those two clusters in the network — a bridge.
  const miscleaved = "LVNELTEFAK" + "HLVDEPQNLIK";
  replicate(theoreticalFragments(miscleaved), 3, "miscleaved", miscleaved);

  // 3) oxidation variant of TVMENFVAFVDK (M is at position 3). Same SEQ as the
  //    unmodified spectra, so SAME COLOUR in the network — but the +16 Da on
  //    every ion containing the M shifts the spectrum enough that the variant
  //    forms a SUB-CLUSTER next to the unmodified TVMENFVAFVDK group.
  replicate(theoreticalFragments("TVMENFVAFVDK", [3]), 3, "ox", "TVMENFVAFVDK");

  return out;
}
```

---

## Cell 8 — A peek at the dataset *(JavaScript)*

```js
md`**${spectra.length} spectra** across **${new Set(spectra.map(s => s.peptide)).size} distinct \`SEQ=\` values**.

- ${spectra.filter(s => s.kind === "tryptic").length} fully tryptic replicates of ${PEPTIDES.join(", ")}
- ${spectra.filter(s => s.kind === "miscleaved").length} replicates of a **miscleaved** peptide (a bridge between two parents)
- ${spectra.filter(s => s.kind === "ox").length} replicates with a **Met oxidation** (sub-cluster within TVMENFVAFVDK)
`
```

---

## Cell 9 — Binning: turning a spectrum into a vector *(JavaScript)*

```js
// Group peaks into bins of width binWidth (in m/z). Two replicates whose peaks
// are slightly shifted (e.g. 365.21 vs 365.23) land in the SAME bin and become
// comparable. Returns a Map<bin index, summed intensity>.
binSpectrum = (spectrum, binWidth = 1.0) => {
  const bins = new Map();
  for (const peak of spectrum.peaks) {
    const bin = Math.floor(peak.mz / binWidth);
    bins.set(bin, (bins.get(bin) ?? 0) + peak.intensity);
  }
  return bins;
}
```

---

## Cell 10 — What one spectrum looks like, binned *(JavaScript)*

```js
binnedExample = {
  const example = spectra[0];
  const bins = binSpectrum(example, 1);
  const data = [...bins.entries()].map(([bin, intensity]) => ({ mz: bin, intensity }));
  const W = 720, H = 220, m = { top: 12, right: 14, bottom: 36, left: 50 };
  const x = d3.scaleLinear().domain([0, d3.max(data, d => d.mz)]).range([0, W - m.left - m.right]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.intensity)]).range([H - m.top - m.bottom, 0]);

  const svg = d3.create("svg").attr("viewBox", [0, 0, W, H]).attr("width", W)
    .attr("style", "max-width:100%;height:auto;background:#fafafa;border-radius:8px");
  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);
  g.append("g").attr("transform", `translate(0,${H - m.top - m.bottom})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y).ticks(4));
  g.append("g").selectAll("line").data(data).join("line")
    .attr("x1", d => x(d.mz)).attr("x2", d => x(d.mz))
    .attr("y1", y(0)).attr("y2", d => y(d.intensity))
    .attr("stroke", "#1F3A5F").attr("stroke-width", 3);
  g.append("text").attr("x", (W - m.left - m.right) / 2).attr("y", H - m.top - 8)
    .attr("text-anchor", "middle").attr("fill", "#4A4A4A").text(`${example.peptide} — binned (1 Da)`);
  return svg.node();
}
```

---

## Cell 11 — Part 2 header *(Markdown)*

```md
## Part 2 — Your turn: cosine, then watch the network appear

Write `cosineSimilarity` in Cell 12. Once it returns sensible numbers the
**similarity matrix** in Cell 13 fills in, the **graph** in Cell 15 acquires
edges, and the **network** in Cell 16 settles into clusters.

If your function returns 0 for everything, the network will be a cloud of
lonely nodes. If it returns numbers near 1 for everything, the network will
be one big tangle. The right answer is somewhere in between — and the
threshold slider lets you choose how strict to be.
```

---

## Cell 12 — TODO: write cosineSimilarity *(JavaScript)*

```js
// TODO: cosine similarity between two spectra, using binSpectrum.
//
//   cos(a, b) = dot(a, b) / (|a| * |b|)
//
// Steps:
//   1. va = binSpectrum(a, binWidth);  vb = binSpectrum(b, binWidth);
//   2. dot   = sum over bins in BOTH va and vb of va[bin] * vb[bin]
//   3. normA = sqrt( sum over va of intensity^2 )
//   4. normB = sqrt( sum over vb of intensity^2 )
//   5. return dot / (normA * normB), or 0 if either norm is 0.
//
// Returning 0 is fine while you work — the chart in Cell 16 will just show
// every node alone, with no edges, until your function starts finding
// similarities.
cosineSimilarity = (a, b, binWidth = 1.0) => {
  // your code here
  return 0;
}
```

---

## Cell 13 — The similarity matrix *(JavaScript)*

```js
similarityMatrix = spectra.map((a, i) =>
  spectra.map((b, j) => (i === j ? 1 : cosineSimilarity(a, b)))
)
```

---

## Cell 14 — The threshold knob *(JavaScript)*

```js
viewof threshold = Inputs.range([0, 1], { value: 0.5, step: 0.01, label: "Edge threshold (cosine)" })
```

---

## Cell 15 — Build the graph *(JavaScript)*

```js
graph = {
  const nodes = spectra.map(s => ({ id: s.id, spectrum: s }));
  const links = [];
  for (let i = 0; i < spectra.length; i++) {
    for (let j = i + 1; j < spectra.length; j++) {
      const w = similarityMatrix[i][j];
      if (w >= threshold) {
        links.push({ source: spectra[i].id, target: spectra[j].id, weight: w });
      }
    }
  }
  return { nodes, links };
}
```

---

## Cell 16 — The spectrum-similarity network *(JavaScript)*

```js
network = {
  const width = 720, height = 480;
  const peptides = Array.from(new Set(graph.nodes.map(n => n.spectrum.peptide)));
  const color = d3.scaleOrdinal().domain(peptides).range(d3.schemeTableau10);

  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]).attr("width", width)
    .attr("style", "max-width:100%;height:auto;background:#fafafa;border-radius:8px");

  // working copies — d3-force mutates these in place
  const nodes = graph.nodes.map(n => ({ ...n }));
  const links = graph.links.map(l => ({ ...l }));

  const simulation = d3.forceSimulation(nodes)
    .force("link",   d3.forceLink(links).id(d => d.id).distance(54).strength(l => l.weight))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(16));

  const link = svg.append("g").attr("stroke", "#c4c9d2")
    .selectAll("line").data(links).join("line")
    .attr("stroke-width", l => 0.6 + l.weight * 2.4);

  const node = svg.append("g").attr("stroke", "#fff").attr("stroke-width", 1.6)
    .selectAll("circle").data(nodes).join("circle")
      .attr("r", 11)
      .attr("fill", d => color(d.spectrum.peptide))
      .call(drag(simulation));
  node.append("title").text(d => `${d.spectrum.id}\n${d.spectrum.peptide}`);

  simulation.on("tick", () => {
    link.attr("x1", l => l.source.x).attr("y1", l => l.source.y)
        .attr("x2", l => l.target.x).attr("y2", l => l.target.y);
    node.attr("cx", d => d.x).attr("cy", d => d.y);
  });

  // legend
  const legend = svg.append("g").attr("transform", "translate(14,16)");
  peptides.forEach((p, i) => {
    const row = legend.append("g").attr("transform", `translate(0,${i * 22})`);
    row.append("circle").attr("r", 7).attr("fill", color(p));
    row.append("text").attr("x", 14).attr("y", 5).attr("font-size", 13).attr("fill", "#4A4A4A").text(p);
  });

  invalidation.then(() => simulation.stop());

  function drag(sim) {
    return d3.drag()
      .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag",  (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end",   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
  }

  return svg.node();
}
```

---

## Cell 17 — Cluster check: do colours and clusters agree? *(JavaScript)*

```js
clusterReport = {
  // categorise every pair: tight replicates, mod-vs-unmod, bridge-vs-parent,
  // or unrelated. The four buckets together show the cosine has STRUCTURE,
  // not just 0/1 — which is what makes the threshold a real design choice.
  const buckets = { replicates: [], "mod-vs-unmod": [], "bridge-vs-parent": [], unrelated: [] };

  // parent SEQs of the miscleaved peptide (for the bridge category)
  const bridgeParents = { "LVNELTEFAKHLVDEPQNLIK": new Set(["LVNELTEFAK", "HLVDEPQNLIK"]) };

  for (let i = 0; i < spectra.length; i++) {
    for (let j = i + 1; j < spectra.length; j++) {
      const c = similarityMatrix[i][j];
      const a = spectra[i], b = spectra[j];
      let bucket;
      if (a.peptide === b.peptide) {
        bucket = (a.kind === b.kind) ? "replicates" : "mod-vs-unmod";
      } else if (bridgeParents[a.peptide]?.has(b.peptide) || bridgeParents[b.peptide]?.has(a.peptide)) {
        bucket = "bridge-vs-parent";
      } else {
        bucket = "unrelated";
      }
      buckets[bucket].push(c);
    }
  }

  const fmt = a => a.length
    ? `n=${a.length}, min ${d3.min(a).toFixed(2)}, median ${d3.median(a).toFixed(2)}, max ${d3.max(a).toFixed(2)}`
    : "—";
  return md`
**Replicates** (same peptide, same form) — ${fmt(buckets.replicates)}
**Mod vs unmod** (oxidation, same SEQ) — ${fmt(buckets["mod-vs-unmod"])}
**Bridge vs parent** (miscleavage) — ${fmt(buckets["bridge-vs-parent"])}
**Unrelated** — ${fmt(buckets.unrelated)}
**Edges at threshold ${threshold}** — ${graph.links.length}
  `;
}
```

---

## Cell 18 — Hints *(Markdown)*

```md
<details>
<summary>Stuck? Open for hints.</summary>

- `binSpectrum(spectrum)` returns a `Map<bin index, intensity>`. Iterate with
  `for (const [bin, intensity] of vec) { ... }` or `vec.entries()`.
- For the dot product you only need bins that are present in **both** maps —
  loop over the first map and ask the second whether it has that bin.
- The norm of a vector is `sqrt(sum of intensity²)`. You can iterate the map's
  `.values()` to collect the squares.
- Sanity check: a spectrum compared with itself should give cosine 1. Two
  replicates of the same peptide-form should give ~0.7-0.9. The miscleaved
  peptide's spectra should sit around 0.2-0.3 with the LVNELTEFAK and
  HLVDEPQNLIK clusters (those are the *bridges*). Unrelated peptides should
  be near 0.
- If your cosines are all 0, you probably never enter the dot-product loop —
  check that you are iterating over `va` (not over numbers 0..N).

</details>
```

---

## Cell 19 — Solution *(Markdown — for the instructor, or after you have tried)*

````md
<details>
<summary>Full solution</summary>

```js
cosineSimilarity = (a, b, binWidth = 1.0) => {
  const va = binSpectrum(a, binWidth);
  const vb = binSpectrum(b, binWidth);

  let dot = 0;
  for (const [bin, intA] of va) {
    const intB = vb.get(bin);
    if (intB !== undefined) dot += intA * intB;
  }

  let normA = 0;
  for (const v of va.values()) normA += v * v;
  let normB = 0;
  for (const v of vb.values()) normB += v * v;

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
```

</details>
````

---

## Notes for the lecture

- **What this notebook is for.** It is the live demo's twin, but more
  importantly it is the place where students *prove* the lecture's claim. The
  network does not render until `cosineSimilarity` works — the most motivating
  exercise loop the notebook can offer.
- **The dataset has structure now.** A seeded RNG produces ≈31 spectra: five
  tryptic peptides with replicates, **one miscleaved peptide** (concatenating
  LVNELTEFAK + HLVDEPQNLIK — a bridge between those two clusters), and **one
  oxidation variant** of TVMENFVAFVDK (same `SEQ=`, so same colour, but a
  visible sub-cluster). The picture is no longer four lonely cliques.
- **Cell 17 tells the story numerically.** Four buckets — replicates,
  mod-vs-unmod, bridge-vs-parent, unrelated — should sit in clearly separated
  ranges (~0.7 / ~0.5 / ~0.2 / ~0). The continuous gradient is the whole
  point: the threshold is no longer trivially "anywhere works".
- **The threshold slider is the lesson.** Drag it from 0.7 down to 0.2:
  - **0.7** — only same-form replicates survive; even oxidation breaks off
  - **0.5** — oxidation reattaches to its parent (sub-cluster within
    TVMENFVAFVDK)
  - **0.3** — the miscleaved peptide's spectra acquire **bridge edges** to
    LVNELTEFAK and HLVDEPQNLIK
  - **0.15** — unrelated peptides start linking by accident
- **Binning first.** Cell 9 sets up `binSpectrum`; Cell 10 visualises it so
  students see what the vector cosine acts on. Worth a minute.
- **Stretch in class:** swap cosine for Jaccard on the set of bins (intensity
  ignored). The miscleaved bridge usually gets *stronger* under Jaccard —
  good moment to talk about how the choice of metric shapes the picture.
- **Timing.** Part 1 ≈ 4 min walked through. Part 2's `cosineSimilarity` ≈ 6
  min in class; finish as homework alongside the app's threshold slider.
