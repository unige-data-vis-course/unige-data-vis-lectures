---
marp: true
theme: unige
paginate: true
size: 16:9
header: 'Data Visualisation · D3.js'
footer: 'UniGE · D3.js · Docker primer'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# Docker — what's in the box?

## D3.js Module · Aside on containers

Data Visualisation · Theory & Practice
University of Geneva · *Alexandre Masselot*

<!--
A 15-minute primer before we use Docker for real in Session 3. The goal is to
make containers feel concrete and to put our two-container setup in context —
it is the smallest interesting example of a pattern that scales (eventually) to
Kubernetes. Aim for one minute per slide, don't dive into command syntax.
-->

---

# Contents

1. **The pain** — why "works on my machine" is a real problem
2. **One container** — what is actually inside the box
3. **The Dockerfile** — the recipe to build a container
4. **Many containers** — `docker-compose`, and our two-container setup
5. **A real stack** — databases, caches, queues, all in containers
6. **Beyond one machine** — a glimpse of Kubernetes

<!--
Six stops, narrative arc. The middle (stops 3-4) is the technical content;
stops 5-6 zoom out to the wider ecosystem so students see the pattern, not
just the tool. Keep the K8s slide to a glimpse — they do not need to know it,
they need to know it exists.
-->

---

<!-- _class: lead -->

# 1 · The pain

Software is hard to move. Containers were invented to make moving it easy.

---

# "Works on my machine"

<div class="columns wide-right">
<div>

You wrote a tool. It runs perfectly on your laptop.

- The TA tries it on Windows → missing dependency.
- The server has the **wrong Node version** → mysterious crash.
- A colleague installed the same package six months ago → different version, different behaviour.

The code is fine. The **environment** moved.

</div>
<div>

<svg viewBox="0 0 320 230" width="320">
  <rect x="14" y="12" width="290" height="60" rx="8" fill="#E8F3E9" stroke="#2E7D32"/>
  <text x="28" y="34" font-size="13" fill="#1F5D23" font-weight="700">Your laptop</text>
  <text x="28" y="54" font-size="11" fill="#1F5D23">Node 20 · Python 3.11 · libfoo 2.4 ✓</text>
  <rect x="14" y="84" width="290" height="60" rx="8" fill="#FCEEDD" stroke="#E07A00"/>
  <text x="28" y="106" font-size="13" fill="#A24F00" font-weight="700">The TA's Windows</text>
  <text x="28" y="126" font-size="11" fill="#A24F00">Node 18 · no libfoo  ✗</text>
  <rect x="14" y="156" width="290" height="60" rx="8" fill="#FAD2DD" stroke="#CF0063"/>
  <text x="28" y="178" font-size="13" fill="#8A0040" font-weight="700">The server</text>
  <text x="28" y="198" font-size="11" fill="#8A0040">Node 22 · libfoo 1.9  ✗</text>
</svg>

</div>
</div>

<!--
Concrete pain. Most students have felt it at least once even in a Python
class. The point is not to dwell on the misery but to motivate containers as
a SOLUTION to a real problem — they are not a fashion, they are a fix.
-->

---

<!-- _class: lead -->

# 2 · One container

What you actually get when someone says "ship it in a container".

---

# A container is a sealed lunchbox

<div class="columns">
<div class="panel panel-intuition">

#### Intuition

A container is a **sealed lunchbox**: the code, its runtime (Node, Python, whatever), its libraries, its OS bits — everything travels together.

Whoever opens the box gets the *same* lunch you packed. On any kitchen.

The opposite of "works on my machine".

</div>
<div class="panel panel-formal">

#### Formal

A container is an **isolated process** running on a stripped-down **filesystem image**, sharing the host's kernel.

- much lighter than a VM (no full OS)
- starts in milliseconds
- the **image** is the artefact you share
- every machine that runs the image gets the same process

</div>
</div>

<!--
The lunchbox image is the one students remember. Then the technical
distinction: a container is NOT a VM. It's a process with its own filesystem,
sharing the kernel — that's why it starts in milliseconds and weighs MBs not
GBs. The IMAGE is the build artefact; the CONTAINER is one running instance
of it.
-->

---

# One command, one tool

```bash
docker run -p 80:80 nginx
```

This single line, on any machine with Docker:

1. **Pulls** the `nginx` image from Docker Hub (cached after the first time).
2. **Starts** a container running nginx.
3. **Maps** the container's port 80 to your machine's port 80.

Open `http://localhost` → nginx's welcome page. Same on a Mac, on Linux, on the server, on a colleague's Windows. **No nginx installed on your machine.**

<div class="note small">

The image is on **Docker Hub** — a public registry, like GitHub for container images. `nginx`, `postgres`, `python:3.12`, `node:20-alpine` — all one `docker pull` away.

</div>

<!--
The first "wow" moment when learning Docker is exactly this: a public-facing
web server with one command, no install, no config. Worth pausing on. Note
the port mapping — without -p 80:80 the container runs but is unreachable
from the host. This is the bridge between "container land" and "your machine".
-->

---

<!-- _class: lead -->

# 3 · The Dockerfile

What if the image you want does not exist yet? You write a recipe.

---

# The Dockerfile — a recipe

<div class="columns">
<div>

A **Dockerfile** is the script that builds an image. A handful of lines describe what to install and how to start it.

```bash
docker build -t my-service .   # bake the image
docker run my-service          # serve a slice
```

Every line in a Dockerfile creates a **layer** of the image — and layers are cached, so rebuilds are fast.

</div>
<div>

```dockerfile
# our data service's Dockerfile
# (yes, this is the whole thing)
FROM node:20-alpine
WORKDIR /service
COPY server.js spectra.mgf ./
EXPOSE 8081
CMD ["node", "server.js"]
```

- `FROM` — start from an existing image
- `COPY` — bring your files in
- `EXPOSE` — declare a port
- `CMD` — what to run when it starts

</div>
</div>

<!--
Walk the five lines. Stress: FROM is the magic — you do not start from a bare
OS, you start from an image somebody already built (the official node:20
alpine, in this case ~50 MB total). Your image inherits all of it. This is
why Docker images are small and quick to build: most of the work was done
upstream, your Dockerfile only adds your code on top.
-->

---

<!-- _class: lead -->

# 4 · Many containers

One container is rarely enough. Most apps need two, three, more.

---

# `docker-compose` — wiring services together

One container does ONE thing. A real application needs **several**.

A `docker-compose.yml` lists the **services**, the **ports** to expose, and the **dependencies** between them.

```yaml
services:
  app:
    build: ./app
    ports: ["8080:80"]
    depends_on: [data-service]

  data-service:
    build: ./data-service
    ports: ["8081:8081"]
```

**One command — `docker compose up` — brings the whole system up.** A colleague who clones the repo runs the same command. The TA running the demo runs the same command.

<!--
Compose is the layer that turns "a bunch of containers" into "a system".
Stress: declarative — you describe what should run, not how to start it.
This is the file that ships with most modern multi-container apps and the
one students will edit in real projects.
-->

---

# Our setup, naively

<div class="columns wide-right">
<div>

For this course we have **two** containers:

- **`app`** — Vite-built site, served by nginx
  → renders the spectrum-similarity network
- **`data-service`** — tiny Node HTTP server
  → returns the spectra dataset

The browser talks to both. They are wired by `docker-compose.yml`.

<div class="note small">

This is the smallest interesting case of the **frontend + backend** split. Real apps follow the same pattern — just with more services.

</div>

</div>
<div>

<svg viewBox="0 0 360 280" width="360">
  <rect x="120" y="14" width="120" height="42" rx="8" fill="#FFFFFF" stroke="#4A4A4A" stroke-width="1.4"/>
  <text x="180" y="40" font-size="13" fill="#1F3A5F" text-anchor="middle" font-weight="700">browser</text>
  <line x1="140" y1="58" x2="80" y2="120" stroke="#4A4A4A" stroke-width="1.4" marker-end="url(#a3)"/>
  <line x1="220" y1="58" x2="280" y2="120" stroke="#4A4A4A" stroke-width="1.4" marker-end="url(#a3)"/>
  <text x="60" y="88" font-size="10" fill="#8A8F98" font-style="italic">:8080</text>
  <text x="280" y="88" font-size="10" fill="#8A8F98" font-style="italic">:8081</text>
  <rect x="18" y="124" width="132" height="120" rx="10" fill="#FCEEDD" stroke="#E07A00" stroke-width="1.6"/>
  <text x="84" y="148" font-size="13" fill="#A24F00" text-anchor="middle" font-weight="700">app</text>
  <text x="84" y="170" font-size="11" fill="#A24F00" text-anchor="middle">nginx</text>
  <text x="84" y="188" font-size="11" fill="#A24F00" text-anchor="middle">Vite + TS + d3</text>
  <text x="84" y="230" font-size="10" fill="#A24F00" text-anchor="middle" font-style="italic">container</text>
  <rect x="210" y="124" width="132" height="120" rx="10" fill="#E8F3E9" stroke="#2E7D32" stroke-width="1.6"/>
  <text x="276" y="148" font-size="13" fill="#1F5D23" text-anchor="middle" font-weight="700">data-service</text>
  <text x="276" y="170" font-size="11" fill="#1F5D23" text-anchor="middle">Node http</text>
  <text x="276" y="188" font-size="11" fill="#1F5D23" text-anchor="middle">serves .mgf</text>
  <text x="276" y="230" font-size="10" fill="#1F5D23" text-anchor="middle" font-style="italic">container</text>
  <text x="180" y="270" font-size="11" fill="#4A4A4A" text-anchor="middle" font-style="italic">docker-compose.yml wires them</text>
  <defs>
    <marker id="a3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="#4A4A4A"/>
    </marker>
  </defs>
</svg>

</div>
</div>

<!--
This is OUR setup, the one we'll touch in Session 3. Honest framing: it is
the smallest interesting example. Real apps look like the next slide; ours
is the first step on that ladder. Note: the browser hits two URLs because
compose maps both container ports to the host. No proxy, no fancy routing.
-->

---

# A real stack — many containers, one thing each

<div class="columns wide-right">
<div>

Production apps keep adding services. Each in its own container:

- **frontend** — nginx serving the SPA
- **API** — a Node / Python / Go server
- **PostgreSQL** — the database
- **Redis** — a fast cache / session store
- **RabbitMQ** — a message queue
- **worker** — picks jobs off the queue

All described in **one** `docker-compose.yml` (or a Helm chart, see slide 11).

</div>
<div>

<svg viewBox="0 0 380 320" width="380">
  <rect x="160" y="6" width="100" height="34" rx="6" fill="#FFFFFF" stroke="#4A4A4A" stroke-width="1.4"/>
  <text x="210" y="28" font-size="12" fill="#1F3A5F" text-anchor="middle" font-weight="700">browser</text>
  <rect x="155" y="55" width="110" height="38" rx="6" fill="#FCEEDD" stroke="#E07A00"/>
  <text x="210" y="79" font-size="12" fill="#A24F00" text-anchor="middle" font-weight="700">frontend</text>
  <rect x="155" y="108" width="110" height="38" rx="6" fill="#FAD2DD" stroke="#CF0063"/>
  <text x="210" y="132" font-size="12" fill="#8A0040" text-anchor="middle" font-weight="700">API</text>
  <rect x="20" y="170" width="100" height="38" rx="6" fill="#E8F3E9" stroke="#2E7D32"/>
  <text x="70" y="194" font-size="12" fill="#1F5D23" text-anchor="middle" font-weight="700">PostgreSQL</text>
  <rect x="160" y="170" width="100" height="38" rx="6" fill="#E8EDF6" stroke="#2C5AA0"/>
  <text x="210" y="194" font-size="12" fill="#1A3D7A" text-anchor="middle" font-weight="700">Redis</text>
  <rect x="290" y="170" width="80" height="38" rx="6" fill="#F4E8F7" stroke="#7E2A8A"/>
  <text x="330" y="194" font-size="12" fill="#5A1F66" text-anchor="middle" font-weight="700">RabbitMQ</text>
  <rect x="285" y="240" width="90" height="38" rx="6" fill="#F4E8F7" stroke="#7E2A8A"/>
  <text x="330" y="264" font-size="12" fill="#5A1F66" text-anchor="middle" font-weight="700">worker</text>
  <g stroke="#9AA1AC" stroke-width="1.2" fill="none">
    <line x1="210" y1="40" x2="210" y2="55"/>
    <line x1="210" y1="93" x2="210" y2="108"/>
    <line x1="180" y1="146" x2="100" y2="170"/>
    <line x1="210" y1="146" x2="210" y2="170"/>
    <line x1="240" y1="146" x2="320" y2="170"/>
    <line x1="330" y1="208" x2="330" y2="240"/>
  </g>
  <text x="190" y="306" font-size="11" fill="#4A4A4A" text-anchor="middle" font-style="italic">six containers, six concerns, one compose file</text>
</svg>

</div>
</div>

<!--
The point is the SHAPE, not the specific services. Three patterns to call
out: (1) one purpose per container — Postgres only stores data, Redis only
caches, the API only orchestrates; (2) the box you choose for each role is
usually a well-known image (postgres:16, redis:7, rabbitmq:3.13) — you very
rarely write Dockerfiles for these; (3) compose ties heterogeneous services
into one system that a colleague can run with one command.
-->

---

# One thing per container — the discipline

Why not bundle everything into one big container?

- **Update independently** — patch PostgreSQL without touching the API.
- **Scale independently** — run **4 copies** of the API, **1 copy** of the database.
- **Replace cleanly** — swap RabbitMQ for Kafka; the API code does not move.
- **Fail in isolation** — a crashing worker does not take the database down.

This is the **single-responsibility** rule for containers, and it is the foundation of *microservices* architecture.

<!--
This is the philosophical slide. Microservices are not just "many small
services" — they are services with CLEAR BOUNDARIES, each owning its data
and its lifecycle. Modern infrastructure assumes this shape. Even if the
students never build production systems, they will USE them — and reading a
docker-compose.yml is reading the architecture of the system.
-->

---

# But compose has a ceiling

`docker compose up` runs everything on **one machine**.

That is fine for:

- development on a laptop
- demos and teaching
- small production deployments

It is **not** fine when:

- traffic outgrows one machine
- a machine fails and you want the system to keep running
- you need rolling, zero-downtime deploys
- containers move around as the cluster reshapes

You need an **orchestrator**.

<!--
Honest scoping: compose is great until it isn't. The line "compose runs on
one machine" is the key insight — every other limitation flows from that.
This sets up Kubernetes as the answer to a specific need, not a fashion.
-->

---

# Kubernetes — a glimpse

<div class="columns wide-right">
<div>

**Kubernetes** runs containers across a **cluster** of machines, and takes care of:

- **scheduling** — which container runs where
- **scaling** — more replicas under load
- **self-healing** — restart failed containers, reschedule them off failing machines
- **service discovery** — containers find each other by name
- **rolling updates** — replace v1 with v2, zero downtime

The same Dockerfile and image you wrote run on Kubernetes — **the container is unchanged**, only the orchestration is bigger.

</div>
<div>

<svg viewBox="0 0 320 280" width="320">
  <rect x="10" y="10" width="300" height="260" rx="10" fill="none" stroke="#1F3A5F" stroke-width="1.6" stroke-dasharray="6 4"/>
  <text x="160" y="32" font-size="13" fill="#1F3A5F" text-anchor="middle" font-weight="700">Kubernetes cluster</text>
  <rect x="24" y="58" width="86" height="80" rx="6" fill="#F4F5F7" stroke="#4A4A4A"/>
  <text x="67" y="76" font-size="11" fill="#1F3A5F" text-anchor="middle" font-weight="600">node 1</text>
  <circle cx="46" cy="100" r="6" fill="#CF0063"/><circle cx="67" cy="100" r="6" fill="#E07A00"/><circle cx="88" cy="100" r="6" fill="#2C5AA0"/>
  <circle cx="46" cy="120" r="6" fill="#2E7D32"/><circle cx="67" cy="120" r="6" fill="#CF0063"/>
  <rect x="118" y="58" width="86" height="80" rx="6" fill="#F4F5F7" stroke="#4A4A4A"/>
  <text x="161" y="76" font-size="11" fill="#1F3A5F" text-anchor="middle" font-weight="600">node 2</text>
  <circle cx="140" cy="100" r="6" fill="#2C5AA0"/><circle cx="161" cy="100" r="6" fill="#7E2A8A"/><circle cx="182" cy="100" r="6" fill="#CF0063"/>
  <circle cx="140" cy="120" r="6" fill="#E07A00"/><circle cx="161" cy="120" r="6" fill="#2C5AA0"/><circle cx="182" cy="120" r="6" fill="#2E7D32"/>
  <rect x="212" y="58" width="86" height="80" rx="6" fill="#F4F5F7" stroke="#4A4A4A"/>
  <text x="255" y="76" font-size="11" fill="#1F3A5F" text-anchor="middle" font-weight="600">node 3</text>
  <circle cx="234" cy="100" r="6" fill="#CF0063"/><circle cx="255" cy="100" r="6" fill="#E07A00"/>
  <circle cx="234" cy="120" r="6" fill="#7E2A8A"/><circle cx="255" cy="120" r="6" fill="#2E7D32"/><circle cx="276" cy="120" r="6" fill="#2C5AA0"/>
  <rect x="74" y="174" width="172" height="48" rx="8" fill="#E8EDF6" stroke="#2C5AA0" stroke-width="1.4"/>
  <text x="160" y="194" font-size="12" fill="#1A3D7A" text-anchor="middle" font-weight="700">control plane</text>
  <text x="160" y="212" font-size="10" fill="#1A3D7A" text-anchor="middle">schedules · scales · heals</text>
  <text x="160" y="254" font-size="10" fill="#8A8F98" text-anchor="middle" font-style="italic">every coloured dot is a running container</text>
</svg>

</div>
</div>

<!--
A glimpse, not a tutorial. The takeaway: Kubernetes does for a cluster what
compose does for one machine. The containers themselves are identical. Hint
at the ecosystem: this is what runs Spotify, GitHub, Airbnb, and almost
every modern SaaS. We will not touch K8s in this course — but they should
recognise the shape if they see it later.
-->

---

# The big picture

<div class="columns">
<div>

**One container** —
`docker run` — your tool in a box.

**A few containers** —
`docker compose up` — your app on one machine.

**Many containers, many machines** —
Kubernetes — your app at scale.

</div>
<div>

<div class="takeaway">

The container is the **constant**. Orchestration is the **variable** — and which orchestrator you pick depends on how big the system needs to be.

What you learn at the bottom of this ladder is what every rung above it builds on.

</div>

</div>
</div>

<!--
The recap. The most important thing students leave with is the LADDER, not
any specific command. They have seen the bottom rung (in Session 3); they
recognise the shape of the next ones; that is enough for an introduction.
-->

---

# References &amp; further reading

- **Docker** — docs.docker.com *(start with the "Getting Started" guide)*
- **Docker Hub** — hub.docker.com *(browse official images: postgres, node, nginx, redis, ...)*
- **docker-compose** — docs.docker.com/compose
- **Kubernetes** — kubernetes.io
- **Bioinformatics pipelines as containers:** Nextflow (nextflow.io), Common Workflow Language (commonwl.org), Snakemake — all wrap containerised tools to make data-analysis pipelines reproducible across labs.

<!--
The "bioinformatics pipelines" line is the one that connects this aside to
their domain. Reproducibility in a paper's methods section is increasingly
"and our containers are available at ghcr.io/...". Worth mentioning so they
see that containers are not just a web-dev fashion.
-->
