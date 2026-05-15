---
marp: true
theme: unige
paginate: true
size: 16:9
header: 'Data Visualisation · D3.js'
footer: 'UniGE · D3.js · (2/3)'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# D3 — binding data, reading peptides

## D3.js Module · Session 2/3

Data Visualisation · Theory & Practice
University of Geneva · *Alexandre Masselot*

<!--
Today D3 finally arrives. The plan: take the hand-built chart and replace its
machinery with D3's — the data-join, scales, axes — then put it to work on a
real problem, reading a peptide off its spectrum. We end by leaving the
notebook behind and starting the TypeScript application. ~45 minutes, tight, one
live demo. Get them coding along where you can.
-->

---

# Contents

1. **The data-join** — `selection.data().join()`
2. **Scales & axes** — `d3.scaleLinear`, and ticks for free
3. **Live demo** — a real spectrum, properly drawn
4. **Reading a peptide off its spectrum** — b/y ions and the match
5. **Into the app** — TypeScript, and the first real component

<div class="note">

Two new things today: a **library** (D3) and a **language** (TypeScript). The biology — *which peptide made this spectrum?* — is what makes them worth learning.

</div>

<!--
Five stops. The centre of gravity is stop 4 — peptide-spectrum matching — and
stop 5 starts the app we grow for the rest of the module. Stops 1-2 are the D3
mechanics; resist the urge to linger, the demo is where they consolidate.
-->

---

<!-- _class: lead -->

# 1 · The data-join

The `.map()` you can already write — made reactive.

---

# A spectrum is an array of `(m/z, intensity)` pairs

<div class="columns">
<div>

The data is an array of values

```js
const peaks = [
  { mz: 147.1128, intensity:  2500 },
  { mz: 365.2183, intensity:  4000 },
  { mz: 494.2609, intensity: 10000 },
  { mz: 595.3086, intensity:  6500 },
  // ...
];
```

</div>
<div>

And the recipe is the one we already know:

```js
peaks.map(p =>
  `<line
     x1=${x(p.mz)} y1=${y(0)}
     x2=${x(p.mz)} y2=${y(p.intensity)}
   />`
);
```

<div class="note">

The catch: it builds the picture *once*. It knows nothing about what to do when the data changes.

</div>


---

# But data changes

A real chart is not static:

- you select another spectrum
- the user filters to the top 20 peaks
- a new spectrum is loaded
- you zoom, and only some peaks stay in view

With `.map()` you would **throw the picture away and rebuild it** every time. We want something that *updates* what is there — touching only what actually changed.

<!--
Make the problem concrete with the three examples. The mental shift: from
"generate the whole picture" to "reconcile the picture with the data". That
reconciliation is the data-join. This is the single most important D3 idea —
spend a moment letting the need land before naming the solution.
-->

---

# `selection.data().join()`

<div class="columns">
<div class="panel panel-intuition">

#### Intuition — the dinner table

You are hosting a **table**; the guest list just changed.

- **enter** — lay a place for each *new* guest
- **update** — fix the setting for guests *still here*
- **exit** — clear away the settings of guests who *left*

You never re-lay the whole table. You reconcile it.

</div>
<div class="panel panel-formal">

#### Formal

`selection.data(array)` compares the new data to the elements already in the DOM, and splits the work three ways:

- **enter** — data with no element yet
- **update** — data whose element exists
- **exit** — elements whose data is gone

`.join("line")` then runs all three for you.

</div>
</div>

<!--
The analogy-then-formal slide for the join. The dinner table should stick:
nobody re-lays the whole table when one guest cancels. Stress that enter/update/
exit is not three methods you call — it is one .join() that handles the three
cases. Memory hook for the rest of the module.
-->

---

# enter + update + exit

```js
g.selectAll("line")               // g is an svg <g> or any container
  .data(peaks)
  .join(
    enter => enter.append("line"),
    update => update,
    exit => exit.remove()
  )
  .attr("x1", p => x(p.mz))
  .attr("x2", p => x(p.mz))
  .attr("y1", y(0))
  .attr("y2", p => y(p.intensity));
```

You describe the picture **once**. Call it again with a new `peaks` array values and D3 makes the **minimum** set of changes to the DOM.



---

# The join default notation: enter + update + exit

```js
g.selectAll("line")
  .data(peaks)                       // bind the array to the selection
  .join("line")                      // enter + update + exit, handled
    .attr("x1", p => x(p.mz))
    .attr("x2", p => x(p.mz))
    .attr("y1", y(0))
    .attr("y2", p => y(p.intensity));
```


<!--
Walk it line by line. selectAll("line") — the elements that SHOULD exist.
.data(peaks) — the data they should carry. .join("line") — make reality match.
The .attr() calls then apply to every joined element. Point out: the callback
`p => x(p.mz)` receives the bound datum — the element now CARRIES its peak.
-->

---

# Explicit enter + update + exit for more complex behaviour

```js
g.selectAll("line")
  .data(peaks)
  .join(
    enter => enter.append("line")
      .attr("stroke", "steelblue")
      .attr("y1", y(0))
      .attr("y2", y(0))              // start animation from baseline
      .call(enter => enter.transition()
        .attr("y2", p => y(p.intensity))),
    update => update
      .attr("stroke", "black")
      .call(update => update.transition()
        .attr("y2", p => y(p.intensity))),
    exit => exit
      .call(exit => exit.transition()
        .attr("y2", y(0))
        .remove())
  )
  .attr("x1", p => x(p.mz))
  .attr("x2", p => x(p.mz))
  .attr("y1", y(0));
```

<div class="ref">D3 modules today: <code>d3-selection</code>, <code>d3-scale</code>, <code>d3-axis</code>.</div>

---

# Why this matters

- Write the data-to-marks binding **once**; it stays correct as the data changes.
- D3 does the DOM bookkeeping — you think about *data → picture*, not *add/remove node*.
- It scales to things that genuinely move: in **Session 3**, a network whose nodes appear and disappear as you filter.

<div class="takeaway">

**The join is the `.map()` of Session 1, made reactive.** Same idea — one datum, one mark — plus a memory of what is already on screen.

</div>

<!--
Close the section. The takeaway line is the one to repeat. Foreshadow Session 3
so the join feels like an investment, not a detour. Then move to scales —
the other half of what we hand-built.
-->

---

<!-- _class: lead -->

# 2 · Scales & axes

The other thing we built by hand — now given to us.

---

# A scale is a translator

<div class="columns">
<div class="panel panel-intuition">

#### Intuition

A scale **translates between two languages**: the language of the *data* (m/z in daltons, intensity in counts) and the language of the *screen* (pixels).

You hand it a value in one language; it hands back the other.

</div>
<div class="panel panel-formal">

#### Formal

```js
const x = d3.scaleLinear()
  .domain([0, 1100])   // data:   m/z
  .range([0, 620]);    // screen: pixels

x(550);   // -> 310
```

`domain` = the data extent. `range` = the pixel extent. This *is* the `x()` you wrote by hand.

</div>
</div>

<!--
Analogy-then-formal for scales. The "translator" framing matters: a scale is
not a chart thing, it is a mapping between two number lines. domain in, range
out. Say explicitly: this is precisely the x() function from the hand-built
demo — D3 just hands it to you, with edge cases handled.
-->

---

# `scaleLinear` — and the y-flip, for free

```js
const x = d3.scaleLinear()
  .domain([0, maxMz])
  .range([0, plotW]);

const y = d3.scaleLinear()
  .domain([0, maxIntensity])
  .range([plotH, 0]);          // reversed range  =  the y-flip
```

<div class="columns">
<div>

<svg viewBox="0 0 460 150" width="460">
  <text x="10" y="20" font-size="13" fill="#4A4A4A">domain (m/z)</text>
  <line x1="20" y1="40" x2="430" y2="40" stroke="#1F3A5F" stroke-width="2"/>
  <text x="16" y="58" font-size="11" fill="#8A8F98">0</text>
  <text x="412" y="58" font-size="11" fill="#8A8F98">1100</text>
  <circle cx="225" cy="40" r="4" fill="#E07A00"/>
  <text x="10" y="100" font-size="13" fill="#4A4A4A">range (pixels)</text>
  <line x1="20" y1="120" x2="430" y2="120" stroke="#2C5AA0" stroke-width="2"/>
  <text x="16" y="138" font-size="11" fill="#8A8F98">0</text>
  <text x="416" y="138" font-size="11" fill="#8A8F98">620</text>
  <circle cx="225" cy="120" r="4" fill="#E07A00"/>
  <line x1="225" y1="46" x2="225" y2="114" stroke="#E07A00" stroke-width="1.5" stroke-dasharray="3 3"/>
</svg>

</div>
<div>

The hand-written y-flip from Session 1 is now just a **reversed range**: pixel 0 at the top, `plotH` at the bottom — so a bigger intensity lands higher.

</div>
</div>

<!--
The y-flip used to be arithmetic students had to remember. Now it is one
decision: write the range backwards. Point at the diagram — same point, two
number lines, the scale is the dashed link between them. That is all a scale is.
-->

---

# Axes — ticks and labels, for free

<div class="columns wide-right">
<div>

In Session 1 we skipped tick marks — too fiddly by hand.

`d3.axisBottom(x)` builds them: tick marks, numbers, the domain line — as real `<g>` elements.

```js
g.append("g")
  .attr("transform",
        `translate(0,${plotH})`)
  .call(d3.axisBottom(x));
```

An axis is just a scale, drawn.

</div>
<div>

<svg viewBox="0 0 380 130" width="380">
  <line x1="20" y1="40" x2="360" y2="40" stroke="#4A4A4A" stroke-width="1.5"/>
  <g stroke="#4A4A4A" stroke-width="1.5">
    <line x1="20"  y1="40" x2="20"  y2="48"/>
    <line x1="105" y1="40" x2="105" y2="48"/>
    <line x1="190" y1="40" x2="190" y2="48"/>
    <line x1="275" y1="40" x2="275" y2="48"/>
    <line x1="360" y1="40" x2="360" y2="48"/>
  </g>
  <g font-size="11" fill="#4A4A4A" text-anchor="middle">
    <text x="20"  y="64">0</text>
    <text x="105" y="64">250</text>
    <text x="190" y="64">500</text>
    <text x="275" y="64">750</text>
    <text x="360" y="64">1000</text>
  </g>
  <text x="190" y="95" font-size="12" fill="#8A8F98" text-anchor="middle" font-style="italic">d3.axisBottom(x)</text>
</svg>

</div>
</div>

<!--
The honest framing: an axis is not a new concept, it is a scale rendered. D3
walks the scale's domain, picks "nice" tick values, and emits the <g>/<line>/
<text> for you. .call() is the idiom for "run this generator on this selection".
Don't over-explain .call — they'll absorb it from the demo.
-->

---

# Scales *are* the grammar of graphics

A scale is exactly an **aesthetic mapping**: a data field → a visual channel.

| Data field | Scale | Visual channel |
|---|---|---|
| m/z | `x` | horizontal position |
| intensity | `y` | length |
| ion type (b / y) | colour scale | hue *(later today)* |

<div class="takeaway">

x§The grammar of graphics is D3.js **the literal API**.

</div>

<!--
Tie back to the course spine. Students met "grammar of graphics" abstractly
early on; here it is concrete — every scale IS an aesthetic mapping, and a D3
chart is a set of scales plus marks. Note the third row: colour enters this
session, and it encodes a CATEGORY (b vs y), which is the use colour is good
for. Sets up the matching section.
-->

---

<!-- _class: lead -->

# 3 · Live demo

A real spectrum — `example-spectrum.mgf` — drawn properly.

---

<!-- _class: demo -->

# Demo: the target

<div class="columns wide-right">
<div>

Same data as Session 1, but now built the D3 way:

1. `parseMgf(text)` → a `peaks` array
2. `d3.scaleLinear()` for `x` and `y`
3. `d3.axisBottom` / `axisLeft` — real axes
4. `selectAll().data(peaks).join("line")`
5. a `<title>` on each peak → hover tooltip

</div>
<div>

<svg viewBox="0 0 540 300" width="540">
  <line x1="52" y1="250" x2="520" y2="250" stroke="#4A4A4A" stroke-width="1.5"/>
  <line x1="52" y1="28"  x2="52"  y2="250" stroke="#4A4A4A" stroke-width="1.5"/>
  <g stroke="#4A4A4A" stroke-width="1.2">
    <line x1="52"  y1="250" x2="52"  y2="256"/>
    <line x1="169" y1="250" x2="169" y2="256"/>
    <line x1="286" y1="250" x2="286" y2="256"/>
    <line x1="403" y1="250" x2="403" y2="256"/>
    <line x1="520" y1="250" x2="520" y2="256"/>
  </g>
  <g font-size="9" fill="#8A8F98" text-anchor="middle">
    <text x="52"  y="268">0</text>
    <text x="286" y="268">550</text>
    <text x="520" y="268">1100</text>
  </g>
  <line x1="73"  y1="250" x2="73"  y2="200" stroke="#1F3A5F" stroke-width="2"/>
  <line x1="113" y1="250" x2="113" y2="232" stroke="#1F3A5F" stroke-width="2"/>
  <line x1="207" y1="250" x2="207" y2="170" stroke="#1F3A5F" stroke-width="2"/>
  <line x1="262" y1="250" x2="262" y2="40"  stroke="#1F3A5F" stroke-width="2"/>
  <line x1="305" y1="250" x2="305" y2="118" stroke="#1F3A5F" stroke-width="2"/>
  <line x1="350" y1="250" x2="350" y2="92"  stroke="#1F3A5F" stroke-width="2"/>
  <line x1="420" y1="250" x2="420" y2="148" stroke="#1F3A5F" stroke-width="2"/>
  <line x1="486" y1="250" x2="486" y2="208" stroke="#1F3A5F" stroke-width="2"/>
  <text x="286" y="288" font-size="11" fill="#4A4A4A" text-anchor="middle">m/z</text>
  <text x="22" y="140" font-size="11" fill="#4A4A4A" text-anchor="middle" transform="rotate(-90 22 140)">intensity</text>
</svg>

</div>
</div>

<!--
Switch to Observable (the Session 2 notebook is the demo's twin). Walk the five
steps before typing. ~8 minutes. This slide is the fallback picture. The
deliberate contrast with Session 1: this time the axes are real and we did not
do a single piece of pixel arithmetic by hand.
-->

---

<!-- _class: demo -->

# Demo: the code that matters

```js
const x = d3.scaleLinear()
  .domain([0, d3.max(peaks, p => p.mz)]).range([0, plotW]);
const y = d3.scaleLinear()
  .domain([0, d3.max(peaks, p => p.intensity)]).range([plotH, 0]);

g.append("g").attr("transform", `translate(0,${plotH})`)
  .call(d3.axisBottom(x));
g.append("g").call(d3.axisLeft(y));

g.selectAll("line")
  .data(peaks)
  .join("line")
    .attr("x1", p => x(p.mz)).attr("x2", p => x(p.mz))
    .attr("y1", y(0)).attr("y2", p => y(p.intensity))
    .attr("stroke", "#1F3A5F");
```

<!--
Three blocks: scales, axes, the join. Point out d3.max — D3 finds the data
extent so we don't hard-code the domain like we did in Session 1. The whole
chart is now declarative: scales + one join. Keep the live version this close
to the slide.
-->

---

<!-- _class: lead -->

# 4 · Reading a peptide off its spectrum

The biology that makes the picture worth building.

---

# The question

<div class="biology">

You are handed a tandem mass spectrum. **Which peptide produced it?**

Shotgun proteomics asks this **millions of times per experiment** — it is how a list of proteins comes out of a mass spectrometer.

</div>

Our spectrum is `example-spectrum.mgf`. Our candidate peptide is **LVNELTEFAK** — a tryptic peptide of BSA. The job: line up what the peptide *should* produce against what we *observed*.

<!--
Frame matching as the core task of proteomics, not a toy. We have one spectrum
and one candidate sequence; the rest of the section is how you decide whether
they go together. In a real search engine the candidate comes from a database
of millions — same matching logic, run at scale.
-->

---

# How a peptide fragments

<div class="columns">
<div class="panel panel-intuition">

#### Intuition — a chain that snaps

A peptide is a chain of beads. In the instrument it **snaps at a backbone bond**.

- the piece keeping the **start** (N-terminus) is a **b-ion**
- the piece keeping the **end** (C-terminus) is a **y-ion**

Snap at every bond → a whole ladder of b- and y-ions.

</div>
<div class="panel panel-formal">

#### Formal

For a cleavage after residue *i*:

$$b_i = \sum_{k=1}^{i} m_k + m_{\text{proton}}$$

$$y_i = \sum_{k=n-i+1}^{n} m_k + m_{\text{water}} + m_{\text{proton}}$$

A peptide of length *n* gives *n − 1* of each.

</div>
</div>

<svg viewBox="0 0 760 96" width="760">
  <line x1="60" y1="48" x2="700" y2="48" stroke="#9AA1AC" stroke-width="2"/>
  <g font-size="15" font-weight="700" fill="#1F3A5F" text-anchor="middle">
    <circle cx="90" cy="48" r="17" fill="#EAEDF2"/><text x="90" y="53">L</text>
    <circle cx="190" cy="48" r="17" fill="#EAEDF2"/><text x="190" y="53">V</text>
    <circle cx="290" cy="48" r="17" fill="#EAEDF2"/><text x="290" y="53">N</text>
    <circle cx="390" cy="48" r="17" fill="#EAEDF2"/><text x="390" y="53">E</text>
    <circle cx="490" cy="48" r="17" fill="#EAEDF2"/><text x="490" y="53">L</text>
    <circle cx="590" cy="48" r="17" fill="#EAEDF2"/><text x="590" y="53">…</text>
  </g>
  <line x1="340" y1="20" x2="340" y2="76" stroke="#CF0063" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="225" y="16" font-size="12" fill="#2C5AA0" text-anchor="middle">b-ion ← keeps the start</text>
  <text x="470" y="16" font-size="12" fill="#CF0063" text-anchor="middle">keeps the end → y-ion</text>
</svg>

<div class="ref">Fragment-ion nomenclature: Roepstorff &amp; Fohlman (1984), <em>Biomed. Mass Spectrom.</em> 11(11).</div>

<!--
The chain-snapping analogy sits beside the equation — that pairing is the
course's house style. Don't dwell on the sums; the message is "b keeps the
start, y keeps the end, and the mass is just the residues you kept plus a
proton (and a water for y)". The function that does this is GIVEN in the app —
say so now so nobody panics about the maths.
-->

---

# The match

1. Compute the **theoretical** b/y ladder for the candidate peptide.
2. Overlay it on the **observed** peaks.
3. A peak within a small **mass tolerance** of a predicted ion is a **match**.

<div class="columns">
<div class="note">

**The tolerance is a knob.**
Too tight → you miss real peaks (instruments are not perfect).
Too loose → noise peaks match by accident.

</div>
<div class="note">

`matchPeptide(spectrum, peptide, toleranceDa)` returns the list of annotations — each one a peak paired with the ion it matched.

</div>
</div>

<!--
Matching is a comparison within a tolerance window — that is the whole
algorithm. The tolerance knob is this session's exercise, so plant it firmly
here. In the app, matchPeptide is the function students will poke at; name it
now.
-->

---

# The annotated spectrum

<div class="columns wide-right">
<div>

The same stick plot — but now each peak is **coloured by what it matched**:

- <span class="navy">b-ions</span> — navy
- <span style="color:#CF0063;font-weight:700">y-ions</span> — pink
- unmatched — grey

Colour here carries a **category**, not a magnitude — exactly what Cleveland &amp; McGill said colour is good for.

</div>
<div>

<svg viewBox="0 0 470 290" width="470">
  <g font-size="15" font-weight="700" text-anchor="middle">
    <text x="40" y="30" fill="#1F3A5F">L</text>
    <text x="90" y="30" fill="#1F3A5F">V</text>
    <text x="140" y="30" fill="#1F3A5F">N</text>
    <text x="190" y="30" fill="#1F3A5F">E</text>
    <text x="240" y="30" fill="#1F3A5F">L</text>
    <text x="290" y="30" fill="#1F3A5F">T</text>
    <text x="340" y="30" fill="#1F3A5F">E</text>
    <text x="390" y="30" fill="#1F3A5F">F</text>
    <text x="430" y="30" fill="#1F3A5F">A·K</text>
  </g>
  <line x1="30" y1="255" x2="455" y2="255" stroke="#4A4A4A" stroke-width="1.5"/>
  <line x1="30" y1="50"  x2="30"  y2="255" stroke="#4A4A4A" stroke-width="1.5"/>
  <!-- y-ions (pink) -->
  <line x1="55"  y1="255" x2="55"  y2="170" stroke="#CF0063" stroke-width="2.5"/>
  <text x="55" y="162" font-size="10" fill="#CF0063" text-anchor="middle">y1</text>
  <line x1="120" y1="255" x2="120" y2="120" stroke="#CF0063" stroke-width="2.5"/>
  <text x="120" y="112" font-size="10" fill="#CF0063" text-anchor="middle">y3</text>
  <line x1="170" y1="255" x2="170" y2="60"  stroke="#CF0063" stroke-width="2.5"/>
  <text x="170" y="52" font-size="10" fill="#CF0063" text-anchor="middle">y4</text>
  <line x1="225" y1="255" x2="225" y2="105" stroke="#CF0063" stroke-width="2.5"/>
  <text x="225" y="97" font-size="10" fill="#CF0063" text-anchor="middle">y5</text>
  <line x1="290" y1="255" x2="290" y2="92"  stroke="#CF0063" stroke-width="2.5"/>
  <text x="290" y="84" font-size="10" fill="#CF0063" text-anchor="middle">y6</text>
  <line x1="355" y1="255" x2="355" y2="135" stroke="#CF0063" stroke-width="2.5"/>
  <text x="355" y="127" font-size="10" fill="#CF0063" text-anchor="middle">y7</text>
  <!-- b-ions (navy) -->
  <line x1="95"  y1="255" x2="95"  y2="205" stroke="#2C5AA0" stroke-width="2.5"/>
  <text x="95" y="197" font-size="10" fill="#2C5AA0" text-anchor="middle">b2</text>
  <line x1="205" y1="255" x2="205" y2="185" stroke="#2C5AA0" stroke-width="2.5"/>
  <text x="205" y="177" font-size="10" fill="#2C5AA0" text-anchor="middle">b4</text>
  <line x1="320" y1="255" x2="320" y2="160" stroke="#2C5AA0" stroke-width="2.5"/>
  <text x="320" y="152" font-size="10" fill="#2C5AA0" text-anchor="middle">b6</text>
  <line x1="405" y1="255" x2="405" y2="210" stroke="#2C5AA0" stroke-width="2.5"/>
  <text x="405" y="202" font-size="10" fill="#2C5AA0" text-anchor="middle">b7</text>
  <!-- unmatched (grey) -->
  <line x1="150" y1="255" x2="150" y2="232" stroke="#9AA1AC" stroke-width="1.5"/>
  <line x1="375" y1="255" x2="375" y2="238" stroke="#9AA1AC" stroke-width="1.5"/>
  <text x="242" y="283" font-size="11" fill="#4A4A4A" text-anchor="middle">m/z →</text>
</svg>

</div>
</div>

<!--
This is the picture the whole app is built to produce. Note the sequence drawn
on top — that is the fragmentation ladder. The colour rule is the payoff of the
Cleveland & McGill point from earlier: colour for category (b vs y), never for
magnitude. Two grey peaks remain unmatched — that is honest, real spectra have
noise and ions we did not model.
-->

---

# The payoff

<div class="biology">

Read the matched peaks **in order**. Two consecutive b-ions — or two consecutive y-ions — differ in mass by **exactly one residue**. That gap *is* an amino acid.

</div>

The ladder of matched peaks spells the sequence back out. A spectrum plus a candidate peptide, lined up — that is a **peptide-spectrum match**, and it is the centrepiece of this session.

<div class="ref">The matching idea, at database scale: Eng, McCormack &amp; Yates (1994), <em>J. Am. Soc. Mass Spectrom.</em> — the SEQUEST algorithm.</div>

<!--
Land the "aha": the spacing between consecutive same-series ions reconstructs
the sequence. That is why the annotated spectrum is evidence, not decoration.
SEQUEST reference shows this scales to searching whole databases — same logic,
millions of candidates. Then move to building it for real.
-->

---

<!-- _class: lead -->

# 5 · Into the TypeScript application

Leaving the sketchpad — building something we can grow.

---

# Why leave Observable?

Observable was the right tool for Sessions 1–2: **instant, reactive, zero setup**. A brilliant sketchpad.

But you cannot easily **ship** a notebook, **test** it, **version** it with git, or **grow** it into a real tool with many files.

<div class="takeaway">

Same code, real project. From here on, the module builds **one TypeScript application** — the thing you would actually hand to a colleague.

</div>

<!--
Be fair to Observable — it earned its place, it is not a toy. The move is about
what comes next: tests, git, multiple files, something a collaborator can run.
This is the software-craftsmanship thread of the course. The app is not a
Session 2 artefact — it is the module's spine, and Session 3 extends it.
-->

---

# The app: Vite + TypeScript + d3

Clone from https://github.com/unige-data-vis-course/unige-data-vis-lectures

```bash
cd app_one
npm install      # fetch d3, Vite, TypeScript — once
npm run dev      # dev server + hot reload; edit a file, the page updates
```

<div class="columns">
<div>

**Vite** — the dev server and build tool. Hot reload, no config.
**TypeScript** — JavaScript with a type checker.
**d3** — imported as a real dependency now, not a CDN script.

</div>
<div>

```text
app_one/src/
  types.ts        the data model
  mgf.ts          parse .mgf text
  fragments.ts    b/y ions  (given)
  match.ts        peaks → annotations
  spectrumChart.ts  the D3 component
  main.ts         wires it together
```

</div>
</div>

<!--
Keep tooling light — they have shaky JS, do not lecture on build systems. The
two commands are the whole story: install, then dev. Show the file list so the
app feels navigable, not a wall. The scaffold is pre-built; nobody fights
configuration in class.
-->

---

# Types are a contract

<div class="columns">
<div class="panel panel-intuition">

#### Intuition

A type is a **label on the jar** — and unlike a sticky note, the language actually *checks* it. Put the wrong thing in, you hear about it immediately.

</div>
<div class="panel panel-formal">

#### Formal

```ts
interface Peak {
  mz: number;
  intensity: number;
}
```

Swap m/z and intensity, pass a `string` where a `number` is due, mistype `.intensty` — the compiler stops you, *before* the browser ever runs.

</div>
</div>

The app's model: `Peak`, `Spectrum`, `Peptide`, `FragmentIon`, `Annotation`. Five small types that document the whole module.

<!--
For a class coming from Python, types are the genuinely new idea. The "label on
the jar that gets checked" framing usually lands. Emphasise the payoff: errors
move from runtime (a blank screen, a confused student) to edit time (a red
squiggle with a message). That is worth the friction.
-->

---

# The annotated-spectrum component

```ts
renderSpectrum(container, spectrum, annotations, peptide);
```

One function, the **first real, reusable feature** of the app. Inside it: the margin convention, `scaleLinear`, the axes, the data-join — everything from today.

<div class="takeaway">

In **Session 3** we call `renderSpectrum` again — click a node in the spectrum *network*, and its spectrum renders right here. **Components compose.**

</div>

<!--
The component is the concrete deliverable of the session. It bundles every
mechanic from today behind one call. The forward link matters: this is not
throwaway — Session 3's network reuses it verbatim. That is why we are building
a real app and not another notebook.
-->

---

# The fragment function is given

```ts
import { theoreticalFragments } from "./fragments";
```

`fragments.ts` is **in the scaffold, written for you**. The chemistry is the chain-snapping analogy you saw earlier;

You **use** it. You do not derive it.

<div class="note small">

`matchPeptide` then lines those theoretical ions up against the observed peaks — that is the part you will work with.

</div>

<!--
Explicitly lower the anxiety: the hardest-looking file is the one they do not
have to write. They consume theoreticalFragments; they reason about matchPeptide
and the tolerance. This is the deliberate scoping decision that keeps the
session feasible.
-->

---

# Exercise

**Run the app** — `npm install` then `npm run dev` in `app_one/`.

In `app_one/src/main.ts`, find the knob:

```ts
const TOLERANCE_DA = 0.02;
```

**Change it. Save. Watch.** The match count in the page footer and the colours in the chart react live.

- How *small* can it get before good matches start dropping?
- How *large* before false matches creep in?
- **Stretch:** add the signed mass error to each peak's hover tooltip.

<!--
The exercise is deliberately tiny and concrete — one number, immediate visual
feedback. The two questions turn knob-twiddling into a real lesson about
instrument accuracy vs. false discovery. The stretch goal is for the fast
finishers; do not make it mandatory.
-->

---

# Recap

- **The data-join** — `selection.data().join()`: the `.map()` of Session 1, made reactive. Enter, update, exit.
- **Scales** — `d3.scaleLinear` is the hand-built `x()` / `y()`; the y-flip is just a reversed range; axes come for free.
- **The peptide-spectrum match** — overlay a peptide's theoretical b/y ladder on the observed peaks; matches within tolerance spell the sequence.
- **The app** — Vite + TypeScript + d3; types as a contract; `renderSpectrum` as the first reusable component.

<!--
The four load-bearing ideas. If they keep only these, the session worked. End
on the app — it is what carries into Session 3.
-->

---

# References &amp; further reading

- Bostock, M., Ogievetsky, V., Heer, J. (2011). **D³: Data-Driven Documents.** *IEEE TVCG* 17(12).
- Wilkinson, L. (2005). **The Grammar of Graphics** (2nd ed.). Springer.
- Cleveland, W. S., McGill, R. (1984). **Graphical Perception.** *JASA* 79(387).
- Roepstorff, P., Fohlman, J. (1984). **Proposal for peptide fragment nomenclature.** *Biomed. Mass Spectrom.* 11(11).
- Eng, J. K., McCormack, A. L., Yates, J. R. (1994). **An approach to correlate tandem mass spectral data of peptides with amino acid sequences in a protein database.** *J. Am. Soc. Mass Spectrom.* 5(11). *(SEQUEST)*
- **D3 documentation** — d3js.org *(see `d3-selection`, `d3-scale`, `d3-axis`)* · **Vite** — vitejs.dev

<!--
D3 paper and Grammar of Graphics for the tooling; Cleveland & McGill for the
colour-as-category point; Roepstorff & Fohlman for fragment nomenclature;
SEQUEST for matching at database scale. The doc links are the practical
follow-ups for the exercise.
-->
