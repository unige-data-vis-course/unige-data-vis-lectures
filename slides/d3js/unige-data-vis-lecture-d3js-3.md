---
marp: true
theme: unige
paginate: true
size: 16:9
header: 'Data Visualisation · D3.js'
footer: 'UniGE · D3.js · (3/3)'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# Networks of spectra — clustering by identity

## D3.js Module · Session 3/3

Data Visualisation · Theory & Practice
University of Geneva · *Alexandre Masselot*

<!--
Today we go from one spectrum to many, build a similarity network, and check
whether the picture agrees with what we already know about the peptides. Then
we ship the whole thing with Docker — two containers, one command. ~45 min,
one live demo on the app, the Docker piece is the closing extra.
-->

---

# Contents

1. **From one spectrum to many** — the dataset, the question
2. **Spectral similarity** — cosine as an arrow in m/z space
3. **From matrix to graph** — threshold, network, force layout
4. **Live demo** — the app, now a network of spectra
5. **The verification story** — clusters that agree with identity
6. **Docker** — shipping the app as two containers

<!--
Six stops. The intellectual centre is 2-5; 6 is the extra. Stops 3 and 5 are
the explicit callbacks (to the graphs module, and to Cleveland & McGill's
"colour for category" point from Session 2). Aim for the demo around minute 22.
-->

---

<!-- _class: lead -->

# 1 · From one spectrum to many

The dataset, and the question we will ask of it.

---

# The dataset

We move from one annotated spectrum to a **collection** — an in-silico tryptic digest of BSA:

- **22 fully tryptic peptides** — 15-18 replicate spectra each, with instrument-style noise
- **5 miscleaved peptides** (spanning two adjacent tryptic peptides) — they will **bridge** parent clusters in the network
- **3 Met-oxidation variants** (same `SEQ=`, +16 Da on M) — they sit as **sub-clusters** within their parent group
- **423 spectra** total, each labelled with its known peptide via the MGF `SEQ=` field

<div class="note">

The dataset lives in `data-service/spectra.mgf`, served over HTTP by a small Node service. The app no longer bundles its data — that change is what makes the Docker step at the end possible.

</div>

<!--
The dataset is deliberately richer than 12 clean replicates: miscleavages and
oxidations create intermediate cosines, so the network has STRUCTURE rather
than just bald clusters. That structure is the verification payoff and the
reason the threshold slider matters. The known-peptide labels remain the
secret weapon — they let us VERIFY the similarity story rather than just
admire it.
-->

---

# The question

<div class="biology">

If we measure how **similar** every pair of spectra is, will the spectra that come from the **same peptide** cluster together?

</div>

If yes, the visualisation is doing real work: it recovers identity from raw signal, the same trick proteomics search engines play at industrial scale (and that **molecular networking** in metabolomics relies on).

If no, we have evidence that the similarity measure is broken — also useful.

<div class="ref">GNPS molecular networking: Wang et al. (2016), <em>Nat. Biotechnol.</em> 34(8).</div>

<!--
Frame Session 3 as a verification exercise, not a display exercise. We are
testing a hypothesis with a picture. That framing is the soul of the
"storytelling with graphics" thread of the course — a viz is an argument.
-->

---

<!-- _class: lead -->

# 2 · Spectral similarity

How alike are two spectra? Cosine, in one picture and one equation.

---

# Each spectrum is an arrow

<div class="columns">
<div class="panel panel-intuition">

#### Intuition — an arrow in m/z space

Picture a giant space where **every m/z value is its own axis**. A spectrum becomes an arrow whose length along each axis is the intensity of its peak at that m/z.

Two spectra that fragment the same way → arrows point in **nearly the same direction**.
Two unrelated molecules → arrows point off in unrelated directions.

</div>
<div class="panel panel-formal">

#### Formal — cosine of the angle

$$\cos(\vec{a}, \vec{b}) = \frac{\vec{a} \cdot \vec{b}}{\|\vec{a}\|\,\|\vec{b}\|}$$

- arrows **aligned** → $\cos \approx 1$
- arrows **perpendicular** → $\cos = 0$
- the metric we will use for every pair of spectra

</div>
</div>

<!--
The arrow analogy is the one that lands — students hear "high-dimensional"
and tune out, "an arrow in a big space" and they follow. Cosine measures the
angle between arrows; it ignores arrow LENGTH (which is overall intensity),
so a faint spectrum and a strong one of the same molecule still score high.
That property is exactly what we want.
-->

---

# But real peaks rarely line up exactly

<div class="columns wide-right">
<div>

Two replicates of the same peptide do not put their peaks at *identical* m/z — instrument noise shifts them by a tiny amount.

So we **bin** first: round each m/z down into a `binWidth`-wide bucket and sum the intensities there. Now both spectra produce the same vector of bins, and we can dot them.

`binWidth = 1.0 Da` is a sensible default for low-resolution comparison.

</div>
<div>

<svg viewBox="0 0 320 220" width="320">
  <line x1="20" y1="100" x2="300" y2="100" stroke="#9AA1AC" stroke-width="1.5"/>
  <line x1="40" y1="100" x2="40" y2="60" stroke="#2C5AA0" stroke-width="2.5"/>
  <text x="40" y="52" font-size="11" fill="#2C5AA0" text-anchor="middle">365.21</text>
  <line x1="46" y1="100" x2="46" y2="70" stroke="#CF0063" stroke-width="2.5"/>
  <text x="62" y="62" font-size="11" fill="#CF0063" text-anchor="start">365.23</text>
  <text x="44" y="116" font-size="10" fill="#9AA1AC" text-anchor="middle" font-style="italic">two replicates, slightly shifted</text>
  <text x="160" y="100" font-size="14" fill="#4A4A4A">→</text>
  <line x1="180" y1="180" x2="300" y2="180" stroke="#9AA1AC" stroke-width="1.5"/>
  <rect x="200" y="140" width="30" height="40" fill="#1F3A5F"/>
  <text x="215" y="200" font-size="11" fill="#4A4A4A" text-anchor="middle">bin 365</text>
  <text x="215" y="135" font-size="10" fill="#1F3A5F" text-anchor="middle">both contribute</text>
</svg>

</div>
</div>

<!--
Binning is the practical detail that keeps cosine working on real data. Make
the example concrete: 365.21 and 365.23 are obviously "the same peak" to a
human but a naive dot product treats them as different axes. The bin gathers
them. 1 Da is coarse — high-res instruments use 0.01 Da or a m/z-dependent
tolerance — but for teaching, 1 Da keeps the arithmetic visible.
-->

---

# Cosine, in code

```ts
function cosineSimilarity(a, b, binWidth = 1.0) {
  const va = binSpectrum(a, binWidth);   // Map<bin, intensity>
  const vb = binSpectrum(b, binWidth);

  let dot = 0;
  for (const [bin, intA] of va) {
    const intB = vb.get(bin);
    if (intB !== undefined) dot += intA * intB;
  }

  const normA = Math.sqrt([...va.values()].reduce((s, x) => s + x * x, 0));
  const normB = Math.sqrt([...vb.values()].reduce((s, x) => s + x * x, 0));
  return normA && normB ? dot / (normA * normB) : 0;
}
```

<div class="ref">A modern alternative: <em>spectral entropy</em> similarity, Li et al. (2021), <em>Nat. Methods</em> 18(12).</div>

<!--
This is the function students will write themselves in today's Observable
notebook. In the app it lives in similarity.ts (given). Spectral entropy is
the better metric on real proteomics data — mention it but don't switch.
Cosine is the right teaching metric: the geometry is visible.
-->

---

<!-- _class: lead -->

# 3 · From matrix to graph

When the matrix gets big, draw the network instead.

---

# Matrix, threshold, graph

<div class="columns">
<div>

1. Compute cosine for **every pair** → a similarity matrix.
2. **Threshold**: keep only pairs above (say) 0.5.
3. Surviving pairs become **edges**; spectra become **nodes**.

A dense similarity matrix is hard to read; the same data as a **graph** lets the eye find clusters at a glance.

</div>
<div>

<svg viewBox="0 0 320 220" width="320">
  <g stroke="#D8DBE0" stroke-width="1">
    <line x1="20" y1="30" x2="140" y2="30"/><line x1="20" y1="50" x2="140" y2="50"/>
    <line x1="20" y1="70" x2="140" y2="70"/><line x1="20" y1="90" x2="140" y2="90"/>
    <line x1="20" y1="110" x2="140" y2="110"/><line x1="20" y1="130" x2="140" y2="130"/>
    <line x1="20" y1="30" x2="20" y2="130"/><line x1="40" y1="30" x2="40" y2="130"/>
    <line x1="60" y1="30" x2="60" y2="130"/><line x1="80" y1="30" x2="80" y2="130"/>
    <line x1="100" y1="30" x2="100" y2="130"/><line x1="120" y1="30" x2="120" y2="130"/>
    <line x1="140" y1="30" x2="140" y2="130"/>
  </g>
  <g fill="#2C5AA0">
    <rect x="20" y="30" width="20" height="20"/>
    <rect x="40" y="50" width="20" height="20"/>
    <rect x="60" y="70" width="20" height="20"/>
    <rect x="80" y="90" width="20" height="20"/>
    <rect x="100" y="110" width="20" height="20"/>
    <rect x="40" y="30" width="20" height="20"/><rect x="20" y="50" width="20" height="20"/>
    <rect x="60" y="50" width="20" height="20"/><rect x="40" y="70" width="20" height="20"/>
    <rect x="100" y="90" width="20" height="20"/><rect x="80" y="110" width="20" height="20"/>
  </g>
  <text x="80" y="155" font-size="11" fill="#4A4A4A" text-anchor="middle">similarity ≥ threshold</text>
  <text x="170" y="80" font-size="20" fill="#4A4A4A">→</text>
  <g stroke="#9AA1AC" stroke-width="1.5">
    <line x1="220" y1="50" x2="260" y2="40"/>
    <line x1="220" y1="50" x2="240" y2="80"/>
    <line x1="260" y1="40" x2="240" y2="80"/>
    <line x1="280" y1="110" x2="270" y2="140"/>
    <line x1="280" y1="110" x2="300" y2="135"/>
  </g>
  <g stroke="#FFFFFF" stroke-width="1.5">
    <circle cx="220" cy="50" r="7" fill="#4E79A7"/>
    <circle cx="260" cy="40" r="7" fill="#4E79A7"/>
    <circle cx="240" cy="80" r="7" fill="#4E79A7"/>
    <circle cx="280" cy="110" r="7" fill="#F28E2C"/>
    <circle cx="270" cy="140" r="7" fill="#F28E2C"/>
    <circle cx="300" cy="135" r="7" fill="#F28E2C"/>
  </g>
  <text x="240" y="180" font-size="11" fill="#4A4A4A" text-anchor="middle">two clusters</text>
</svg>

</div>
</div>

<!--
This is the conceptual hinge: a similarity matrix and a thresholded graph are
two views of the same data. The matrix is exact and dense; the graph is lossy
(below-threshold pairs vanish) but legible. Mention that for N spectra there
are N² entries — the graph is what saves you when N gets large.
-->

---

# This is molecular networking

<div class="biology">

What we just built has a name: a **molecular network**. In metabolomics, GNPS does exactly this on millions of small-molecule spectra to discover related compounds. Here we use it on peptides to test whether spectral similarity tracks identity.

</div>

And the drawing it asks for is the one the **graphs module** ended on: **force-directed layout**. Nodes repel each other; edges pull connected nodes together; the picture settles into clusters. Same physics — now driven by real biological data.

<div class="ref">Wang et al. (2016), GNPS · Watrous et al. (2012) introduced spectral networks for natural products.</div>

<!--
Tie the three threads together: cosine similarity (Session 3), the force
layout (graphs module), and the peptide-spectrum match (Session 2). The
graphs module promised D3-force as the implementation; here it is, doing the
job on a real biological problem. Two-minute moment of synthesis.
-->

---

<!-- _class: lead -->

# 4 · Live demo

The app, now a network of spectra.

---

<!-- _class: demo -->

# Demo: the target

<div class="columns wide-right">
<div>

What we build, live, on the existing app:

1. Fetch the **423 spectra** from the data service
2. Compute every pairwise cosine **once** and cache it
3. The **threshold slider** in the page re-thresholds the cache live
4. Render with `d3.forceSimulation`
5. Colour nodes by **identified peptide**
6. Click a node → the Session 2 `renderSpectrum` panel renders

</div>
<div>

<svg viewBox="0 0 360 280" width="360">
  <g stroke="#c4c9d2" stroke-width="1.5">
    <line x1="80" y1="80" x2="120" y2="60"/><line x1="80" y1="80" x2="100" y2="110"/><line x1="120" y1="60" x2="100" y2="110"/>
    <line x1="250" y1="70" x2="290" y2="55"/><line x1="250" y1="70" x2="280" y2="100"/><line x1="290" y1="55" x2="280" y2="100"/>
    <line x1="90" y1="200" x2="130" y2="220"/><line x1="90" y1="200" x2="70" y2="240"/><line x1="130" y1="220" x2="70" y2="240"/>
    <line x1="250" y1="210" x2="290" y2="195"/><line x1="250" y1="210" x2="280" y2="240"/><line x1="290" y1="195" x2="280" y2="240"/>
  </g>
  <g stroke="#FFFFFF" stroke-width="1.6">
    <circle cx="80" cy="80" r="10" fill="#4E79A7"/><circle cx="120" cy="60" r="10" fill="#4E79A7"/><circle cx="100" cy="110" r="10" fill="#4E79A7"/>
    <circle cx="250" cy="70" r="10" fill="#F28E2C"/><circle cx="290" cy="55" r="10" fill="#F28E2C"/><circle cx="280" cy="100" r="10" fill="#F28E2C"/>
    <circle cx="90" cy="200" r="10" fill="#E15759"/><circle cx="130" cy="220" r="10" fill="#E15759"/><circle cx="70" cy="240" r="10" fill="#E15759"/>
    <circle cx="250" cy="210" r="10" fill="#76B7B2"/><circle cx="290" cy="195" r="10" fill="#76B7B2"/><circle cx="280" cy="240" r="10" fill="#76B7B2"/>
  </g>
  <line x1="100" y1="110" x2="90" y2="200" stroke="#c4c9d2" stroke-width="0.8" stroke-dasharray="3 3"/>
  <line x1="280" y1="100" x2="280" y2="195" stroke="#c4c9d2" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="180" y="265" font-size="11" fill="#4A4A4A" text-anchor="middle">~400 spectra · 27 peptides · clusters bridged by miscleavages</text>
</svg>

</div>
</div>

<!--
Switch to the app. The Observable notebook for today is also the demo's twin
(at smaller scale), so you can present from either. ~10 minutes. The cluster
picture above is the result we are aiming for; in the real app each cluster has
15-18 nodes. The threshold SLIDER is your live dial — drag it during the demo
and call out: at high threshold only tight clusters survive; lower it and
oxidation sub-clusters merge into their parents; lower still and miscleavage
bridges appear; too low and unrelated spectra start linking spuriously.
-->

---

<!-- _class: demo -->

# Demo: the code that matters

```ts
const spectra      = await fetchSpectra();                 // network
const similarities = computeSimilarities(spectra);         // O(n²) — ONCE

function rerender(threshold: number) {
  const graph = graphFromSimilarities(spectra, similarities, threshold);

  const simulation = d3.forceSimulation(graph.nodes)
    .force("link",   d3.forceLink(graph.links).id(n => n.id)
                         .strength(l => l.weight))
    .force("charge", d3.forceManyBody().strength(-55));

  svg.append("g").selectAll("circle")
    .data(graph.nodes).join("circle")
      .attr("fill", d => color(d.spectrum.peptide))
      .on("click", (_e, d) => renderSpectrum(detailEl, d.spectrum, ...));
}

slider.addEventListener("input", () => rerender(+slider.value));
```

<!--
The split is the point: O(N²) cosines are computed ONCE; the slider then
re-thresholds the cached list cheaply (just a filter). That's what keeps the
slider responsive at 423 nodes. Note also that renderSpectrum reappears — the
Session 2 component is reused verbatim, click-driven. Components compose.
-->

---

<!-- _class: lead -->

# 5 · The verification story

Does the picture agree with what we already know?

---

# Colour the nodes by identified peptide

The dataset carries each spectrum's known peptide (the `SEQ=` field).

**Use that to colour the nodes** — and colour is honest: a *category* (peptide identity), not a magnitude. Exactly the use case Cleveland & McGill said colour is good for.

<div class="note">

If similarity really tracks identity, the **clusters** in the layout and the **colours** of the nodes will agree. If they don't, we have a problem to investigate.

</div>

<!--
Plant the test before showing the result. The colour is independent
information — we did not use peptide identity to compute similarity, only the
peaks. So agreement between cluster shape and colour is real evidence, not a
tautology.
-->

---

# The payoff — a continuous distribution

The 423 spectra produce a cosine distribution with **structure**, not a clean bimodal split:

| Pair type | Typical cosine | What you see in the network |
|---|---|---|
| **Replicates** (same peptide, same form) | 0.69 – 0.82 | tight, dense clusters |
| **Oxidation vs unmodified** (same `SEQ=`) | 0.46 – 0.58 | sub-cluster pulled aside from the parent |
| **Miscleaved vs parent** | 0.10 – 0.27 | weak edge that **bridges** two parent clusters |
| **Unrelated peptides** | 0.00 – 0.06 | no edge |

Drag the **threshold slider**: high values keep only tight clusters; lower values let oxidation sub-clusters and miscleavage bridges reveal themselves. Too low and unrelated spectra start linking by accident.

<div class="takeaway">

A visualisation is an argument. With a **continuous** cosine distribution, the *threshold choice* is part of the argument — and the slider lets you make it visible.

</div>

<!--
The numbers come from the actual 423-spectrum dataset. Distinction matters:
- replicates cluster tightly (~0.75 median) — the basic verification works
- oxidation sub-clusters within the parent group: a real instrument artefact
  rendered visually
- miscleavages create weak bridges: shared b/y ions between adjacent peptides
- the continuous gradient means there is no single "right" threshold — and
  that's the honest story search engines and molecular networking pipelines
  navigate every day
The slider turns a static figure into an argument the student can interrogate.
-->

---

<!-- _class: lead -->

# 6 · Docker

Shipping the app — and what "deployment" actually means.

---

# Why containerise?

<div class="columns">
<div class="panel panel-intuition">

#### Intuition — a sealed lunchbox

A container is a **sealed lunchbox**: the code, its runtime, its files, its OS dependencies — everything travels together. Whoever opens the box gets the same lunch you packed, on any machine, every time.

The opposite of "works on my machine".

</div>
<div class="panel panel-formal">

#### Formal

A **container** is an isolated process running on a stripped-down filesystem image. A **Dockerfile** is the recipe to build that image. **docker-compose** runs several containers as one system, wiring their ports and networks.

</div>
</div>

<!--
The "lunchbox" framing usually lands faster than "container" — students often
have a vague idea of containers as VMs. Stress: lighter than a VM, exact same
artefact across machines. The pain it removes is the dev-environment one we
all know. Then move to the concrete files.
-->

---

# The two-container split

```
slides/d3js/
├─ data-service/       container A — serves the spectra
│   └─ server.js       (zero-dep Node http server)
├─ app_network/        container B — builds & serves the viz
│   ├─ src/            (Vite + TypeScript + d3)
│   └─ Dockerfile      multi-stage: build then nginx
└─ docker-compose.yml  wires the two together
```

<div class="note">

The split is what session 3 needed anyway — the app no longer bundles its data, it **fetches** it. That single architectural change makes the deployment story honest.

</div>

<!--
Tie the architectural change (fetching) to the Docker payoff. We didn't add
the data service to justify Docker — we needed it to grow the app. Docker
just packages it cleanly. That ordering matters: technology serves a need.
-->

---

# Dockerfile — the app

```dockerfile
# ---- build stage: compile the Vite + TypeScript app ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
RUN npm run build

# ---- serve stage: a tiny nginx serving the built static files ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Multi-stage:** Node tooling does the build, then we ship only the static `dist/` on a tiny nginx image. The final image has no Node, no npm, no source.

<!--
Multi-stage is the one Docker idea worth holding onto from this slide.
Building and serving have different needs — Node for the first, nginx for the
second — and multi-stage lets us throw away the heavy tooling once the build
is done. Final image goes from ~700 MB to ~50 MB.
-->

---

# Dockerfile — the data service

```dockerfile
FROM node:20-alpine
WORKDIR /service
COPY package.json server.js spectra.mgf ./
EXPOSE 8081
CMD ["node", "server.js"]
```

Three meaningful lines. No `npm install` because the service has **zero dependencies** — just Node's built-in `http` module.

<div class="note small">

A useful exercise in restraint: how little code can do this job? When the answer is "a 30-line file", the Dockerfile is correspondingly tiny.

</div>

<!--
The contrast with the app's Dockerfile is the lesson: complexity in your code
shows up as complexity in the container. The data service does one thing
(read a file, send it back), and its image reflects that. Less to break, less
to update, less to secure.
-->

---

# docker-compose.yml — wiring

```yaml
services:
  data-service:
    build: ./data-service
    ports: ["8081:8081"]

  app:
    build: ./app_network
    ports: ["8080:80"]
    depends_on: [data-service]
```

`docker compose up` brings both up; the browser talks to **two URLs on localhost** (8080 for the app, 8081 for the data), exactly as in `npm run dev` — but **one command** instead of two terminals.

<!--
Compose is the layer that turns a list of containers into a system. ports
exposes a container's port on the host so the browser can reach it; depends_on
just orders startup. Worth saying explicitly: the BROWSER sees two services on
localhost, because compose maps both. There is no shared origin.
-->

---

# One command, every machine

<div class="columns">
<div>

**Local dev (Sessions 1-2 style):**

```bash
# terminal A
cd data-service && npm start

# terminal B
cd app_network && npm run dev
```

</div>
<div>

**With Docker:**

```bash
docker compose up --build
# open http://localhost:8080
```

</div>
</div>

<div class="takeaway">

Same system, two ways to run it. Docker isn't faster locally — it's **reproducible**: the colleague who clones the repo gets your environment, not their best guess at it.

</div>

<!--
The honest pitch for Docker: it doesn't make development feel faster on your
own machine. It pays off the moment somebody else (a TA, a collaborator, a
deployment server) needs to run the same code. Reproducibility is the win.
-->

---

# Your exercise

- Get the app running both ways — `npm run dev` + the data service in one terminal each, AND `docker compose up --build`.
- **Drag the threshold slider** in the page. Find three thresholds:
  - **(a)** every peptide is one tight cluster, no bridges
  - **(b)** the miscleavage bridges appear
  - **(c)** unrelated spectra start linking by accident
- **Stretch:** in `app_network/src/similarity.ts`, swap cosine for a different metric (e.g. Jaccard on the set of bins) and see whether the cluster picture survives.

<!--
The required part is the slider — students should hunt for the three
thresholds and notice the gap between (b) and (c) is the "useful range" any
real molecular-networking pipeline picks from. The stretch is real: a Jaccard
implementation is a few lines and lets them ask whether the choice of metric
is load-bearing. (For miscleavages it changes the picture noticeably.)
-->

---

# The module arc

- **Session 1 — SVG.** One mark per datum; the y-flip we now never write again.
- **Session 2 — D3 + matching.** The data-join, scales, axes; a peptide read off its spectrum.
- **Session 3 — networks + Docker.** Many spectra → a graph that recovers identity; the whole system shipped as two containers.

<div class="takeaway">

You built one TypeScript application across three sessions, watched a hand-coded chart turn into a reusable component, used that component inside a force-directed network, and shipped the result. **That arc** — not any single trick — is the thing to take forward.

</div>

<!--
The closing recap. Connect each session's mechanic to the visible payoff in
the app. The point is not to remember every method name but the way real
visualisation work composes: SVG → D3 → component → system.
-->

---

# References & further reading

- Wang, M., et al. (2016). **Sharing and community curation of mass spectrometry data with Global Natural Products Social Molecular Networking.** *Nat. Biotechnol.* 34(8). *(GNPS)*
- Watrous, J., et al. (2012). **Mass spectral molecular networking of living microbial colonies.** *PNAS* 109(26).
- Li, Y., et al. (2021). **Spectral entropy outperforms MS/MS dot product similarity for small-molecule compound identification.** *Nat. Methods* 18(12).
- Cleveland, W. S., McGill, R. (1984). **Graphical Perception.** *JASA* 79(387). *(colour for category)*
- Bostock, M., Ogievetsky, V., Heer, J. (2011). **D³: Data-Driven Documents.** *IEEE TVCG* 17(12).
- **D3** — d3js.org *(see `d3-force`, `d3-scale-chromatic`)* · **Vite** — vitejs.dev · **Docker / Compose** — docs.docker.com

<!--
GNPS and Watrous anchor the molecular-networking lineage; Li et al. is the
modern entropy alternative; Cleveland & McGill closes the colour loop from
Session 2. The doc links are the practical follow-ups for the exercise.
-->
