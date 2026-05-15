# Session 2 — D3, scales, and the peptide-spectrum match (Observable HQ cells)

Paste each block below into its own cell on **observablehq.com**, in order.
Blocks marked *(Markdown)* are Markdown cells; the rest are JavaScript cells.

This notebook **uses D3** — `d3 = require("d3@7")` is Cell 2. Where Session 1's
notebook did the pixel arithmetic by hand, here `d3.scaleLinear` and
`d3.axisBottom` do it for us.

Two parts:

- **Part 1 — worked example.** The spectrum, drawn the D3 way (scales, axes, the
  data-join, a hover tooltip). Then the peptide side: the *given*
  `theoreticalFragments` function and the b/y ladder it predicts.
- **Part 2 — exercise.** You write `matchPeptide`: connect the observed peaks to
  the theoretical ions, within a mass tolerance. A slider lets you explore the
  tolerance, and the annotated spectrum lights up as your matcher works.

---

## Cell 1 — Title *(Markdown)*

```md
# D3, scales, and the peptide-spectrum match

Session 2 of the D3.js module · UniGE Data Visualisation.

In Session 1 we hand-built a stick plot. Today D3 supplies the machinery —
**scales** translate data to pixels, **axes** draw themselves, and the
**data-join** binds an array of peaks to an array of `<line>`s.

Then we put it to work on a real question: *which peptide produced this
spectrum?*
```

---

## Cell 2 — Import D3 *(JavaScript)*

```js
d3 = require("d3@7")
```

---

## Cell 3 — Part 1 header *(Markdown)*

```md
## Part 1 — Worked example: the spectrum, the D3 way

Same spectrum as Session 1 (peptide **LVNELTEFAK**, a tryptic peptide of BSA),
but now built with `d3.scaleLinear`, `d3.axisBottom`, and `selection.join()`.
```

---

## Cell 4 — The data: a real spectrum *(JavaScript)*

```js
peaks = [
  { mz:  147.1128, intensity:  2500 },
  { mz:  185.1648, intensity:   600 },
  { mz:  213.1597, intensity:  1200 },
  { mz:  218.1499, intensity:   900 },
  { mz:  327.2027, intensity:   800 },
  { mz:  365.2183, intensity:  4000 },
  { mz:  456.2453, intensity:  2200 },
  { mz:  494.2609, intensity: 10000 },
  { mz:  569.3293, intensity:  1500 },
  { mz:  595.3086, intensity:  6500 },
  { mz:  652.3664, intensity:   500 },
  { mz:  670.3770, intensity:  3000 },
  { mz:  708.3927, intensity:  7800 },
  { mz:  799.4196, intensity:  1800 },
  { mz:  837.4352, intensity:  5200 },
  { mz:  946.4880, intensity:  1000 },
  { mz:  951.4782, intensity:  3300 },
  { mz: 1050.5466, intensity:  1400 }
]
```

---

## Cell 5 — Layout: dimensions and the margin convention *(JavaScript)*

```js
dims = {
  const W = 760, H = 360;
  const m = { top: 24, right: 20, bottom: 48, left: 60 };
  return { W, H, m, plotW: W - m.left - m.right, plotH: H - m.top - m.bottom };
}
```

---

## Cell 6 — The scales *(JavaScript)*

```js
// m/z  ->  horizontal pixel.  d3.max finds the data extent for us.
x = d3.scaleLinear()
  .domain([0, d3.max(peaks, p => p.mz) * 1.04])
  .range([0, dims.plotW])
```

```js
// intensity  ->  vertical pixel.  The reversed range IS the y-flip.
y = d3.scaleLinear()
  .domain([0, d3.max(peaks, p => p.intensity)])
  .range([dims.plotH, 0])
```

---

## Cell 7 — The spectrum chart *(JavaScript)*

```js
spectrumChart = {
  const { W, H, m, plotW, plotH } = dims;

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, W, H])
    .attr("width", W)
    .attr("style", "max-width:100%;height:auto;background:#fafafa;border-radius:8px");

  const g = svg.append("g")
    .attr("transform", `translate(${m.left},${m.top})`);

  // axes — ticks, numbers and the domain line, for free
  g.append("g")
    .attr("transform", `translate(0,${plotH})`)
    .call(d3.axisBottom(x));
  g.append("g")
    .call(d3.axisLeft(y).ticks(5));

  // the data-join: one peak, one <line>
  g.append("g")
    .selectAll("line")
    .data(peaks)
    .join("line")
      .attr("x1", p => x(p.mz))
      .attr("x2", p => x(p.mz))
      .attr("y1", y(0))
      .attr("y2", p => y(p.intensity))
      .attr("stroke", "#1F3A5F")
      .attr("stroke-width", 1.6)
    .append("title")            // a native hover tooltip
      .text(p => `m/z ${p.mz.toFixed(4)} · intensity ${p.intensity}`);

  g.append("text")
    .attr("x", plotW / 2).attr("y", plotH + 38)
    .attr("text-anchor", "middle").attr("fill", "#4A4A4A")
    .text("m/z");

  return svg.node();
}
```

---

## Cell 8 — Now the peptide side *(Markdown)*

```md
### The peptide side

A peptide fragments along its backbone into **b-ions** (keeping the N-terminus)
and **y-ions** (keeping the C-terminus). The function below predicts that
ladder. It is **given to you** — you only use it.
```

---

## Cell 9 — The candidate peptide *(JavaScript)*

```js
peptide = "LVNELTEFAK"
```

---

## Cell 10 — theoreticalFragments — GIVEN, do not edit *(JavaScript)*

```js
// Predict the singly-charged b/y ion ladder of a peptide.
//   b(i) = (first i residues) + proton
//   y(i) = (last  i residues) + water + proton
// Reference: Roepstorff & Fohlman (1984).
theoreticalFragments = (sequence) => {
  const RESIDUE = {
    G: 57.02146, A: 71.03711, S: 87.03203, P: 97.05276, V: 99.06841,
    T: 101.04768, C: 103.00919, L: 113.08406, I: 113.08406, N: 114.04293,
    D: 115.02694, Q: 128.05858, K: 128.09496, E: 129.04259, M: 131.04049,
    H: 137.05891, F: 147.06841, R: 156.10111, Y: 163.06333, W: 186.07931
  };
  const PROTON = 1.007276, WATER = 18.010565;
  const res = [...sequence].map(aa => RESIDUE[aa] ?? 0);
  const n = res.length;
  const ions = [];
  let bSum = 0;
  for (let i = 0; i < n - 1; i++) {
    bSum += res[i];
    ions.push({ series: "b", index: i + 1, mz: bSum + PROTON });
  }
  let ySum = 0;
  for (let i = 0; i < n - 1; i++) {
    ySum += res[n - 1 - i];
    ions.push({ series: "y", index: i + 1, mz: ySum + WATER + PROTON });
  }
  return ions;
}
```

---

## Cell 11 — The predicted ladder *(JavaScript)*

```js
fragments = theoreticalFragments(peptide)
```

---

## Cell 12 — Part 2 header *(Markdown)*

```md
## Part 2 — Your turn: match the peptide to the spectrum

You now have two arrays: `peaks` (what the instrument **observed**) and
`fragments` (what the peptide is **predicted** to produce). Your job is to
connect them.

Write `matchPeptide` in Cell 14. The slider in Cell 13 controls the mass
tolerance — once your matcher works, drag it and watch the annotated spectrum
in Cell 16 light up.
```

---

## Cell 13 — The tolerance knob *(JavaScript)*

```js
viewof tolerance = Inputs.range([0.001, 0.5], { value: 0.02, step: 0.001, label: "Mass tolerance (Da)" })
```

---

## Cell 14 — TODO: write the matcher *(JavaScript)*

```js
// TODO: for each observed peak, find the theoretical ion whose `mz` is within
// `tolerance` of `peak.mz`. If several ions qualify, keep the CLOSEST one.
// When you find a match, push an object { peak, ion, errorDa } onto
// `annotations`, where errorDa = peak.mz - ion.mz.
//
// Returning the empty array is fine while you work — the chart in Cell 16 will
// just show every peak in grey until your matcher starts finding ions.
matchPeptide = (peaks, fragments, tolerance) => {
  const annotations = [];
  for (const peak of peaks) {
    // your code here
  }
  return annotations;
}
```

---

## Cell 15 — Run the matcher *(JavaScript)*

```js
annotations = matchPeptide(peaks, fragments, tolerance)
```

---

## Cell 16 — The annotated spectrum — GIVEN *(JavaScript)*

```js
annotatedChart = {
  const { W, H, m, plotW, plotH } = dims;
  const COLOR = { b: "#2C5AA0", y: "#CF0063", unmatched: "#9AA1AC" };
  const annotationOf = new Map(annotations.map(a => [a.peak, a]));

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, W, H])
    .attr("width", W)
    .attr("style", "max-width:100%;height:auto;background:#fafafa;border-radius:8px");

  const g = svg.append("g")
    .attr("transform", `translate(${m.left},${m.top})`);

  g.append("g")
    .attr("transform", `translate(0,${plotH})`)
    .call(d3.axisBottom(x));
  g.append("g")
    .call(d3.axisLeft(y).ticks(5));

  // peaks, coloured by what they matched
  g.append("g")
    .selectAll("line")
    .data(peaks)
    .join("line")
      .attr("x1", p => x(p.mz))
      .attr("x2", p => x(p.mz))
      .attr("y1", y(0))
      .attr("y2", p => y(p.intensity))
      .attr("stroke", p => {
        const a = annotationOf.get(p);
        return a ? COLOR[a.ion.series] : COLOR.unmatched;
      })
      .attr("stroke-width", p => annotationOf.get(p) ? 2.4 : 1.1);

  // labels on the matched peaks: "b2", "y4", ...
  g.append("g")
    .selectAll("text")
    .data(annotations)
    .join("text")
      .attr("x", a => x(a.peak.mz))
      .attr("y", a => y(a.peak.intensity) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("fill", a => COLOR[a.ion.series])
      .text(a => `${a.ion.series}${a.ion.index}`);

  g.append("text")
    .attr("x", plotW / 2).attr("y", plotH + 38)
    .attr("text-anchor", "middle").attr("fill", "#4A4A4A")
    .text("m/z");

  return svg.node();
}
```

---

## Cell 17 — Match count *(JavaScript)*

```js
md`**Matched ${annotations.length} of ${peaks.length} peaks** at tolerance ±${tolerance} Da.`
```

---

## Cell 18 — Hints *(Markdown)*

```md
<details>
<summary>Stuck? Open for hints.</summary>

- A `peak` looks like `{ mz, intensity }`; an `ion` from `fragments` looks like
  `{ series, index, mz }`.
- The mass error is `peak.mz - ion.mz`. A peak matches an ion when the
  *absolute value* of that error is at most `tolerance`.
- To keep only the closest ion: loop over `fragments`, remember the best
  candidate so far, and replace it whenever you find one with a smaller
  absolute error.
- Build a small object `{ peak, ion, errorDa }` for each match and push it.
- Sanity check: at tolerance 0.02 Da you should match most of the 18 peaks —
  two of them (an a-ion and a water-loss peak) are not in our b/y model and
  should stay grey.

</details>
```

---

## Cell 19 — Solution *(Markdown — for the instructor, or after you have tried)*

````md
<details>
<summary>Full solution</summary>

```js
matchPeptide = (peaks, fragments, tolerance) => {
  const annotations = [];
  for (const peak of peaks) {
    let best = null;
    for (const ion of fragments) {
      const errorDa = peak.mz - ion.mz;          // signed: observed - theoretical
      if (Math.abs(errorDa) <= tolerance) {
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
```

</details>
````

---

## Notes for the lecture

- **This notebook is the live demo's twin.** Cells 2–7 are exactly the Session 2
  demo: scales, axes, the data-join, a `<title>` tooltip. You can present
  straight from here.
- **`d3.create` vs the htl `svg` tag.** Session 1 used Observable's `svg`
  template literal (no D3). Now we use `d3.create("svg")` and `.append()` —
  the idiom you will see in every D3 example, and the one the TypeScript app
  uses too.
- **The y-flip is gone as arithmetic.** It is now just `range([plotH, 0])` in
  Cell 6 — a reversed range. Worth pausing on: the thing students hand-coded
  last week is one design decision now.
- **`theoreticalFragments` is given on purpose** (Cell 10). The chemistry is the
  chain-snapping analogy from the slides; deriving it would not fit in 45
  minutes. Students *consume* it — the thinking is in `matchPeptide`.
- **The exercise is the matcher, not the maths.** Writing `matchPeptide` is a
  nested loop with a tolerance test — squarely at this class's level, and it
  forces them to handle the "several ions in range, keep the closest" case.
- **The tolerance slider is the discussion.** Drag it down: good matches drop
  out (real instruments are not perfect). Drag it up past ~0.3 Da: grey peaks
  start matching by accident. This is the false-discovery intuition behind
  every real search engine — and it sets up the app exercise, where the same
  knob lives in `main.ts`.
- **Two peaks stay grey at sensible tolerances** (185.16 and 652.37). They are a
  real a-ion and a water-loss peak — outside our simple b/y model. Leaving them
  unmatched is honest; mention it so nobody thinks their matcher is broken.
- **Timing:** Part 1 ≈ 8 min as the demo. Part 2 ≈ 6 min started in class, the
  matcher finished as homework alongside the TypeScript app exercise.
