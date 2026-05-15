import * as d3 from "d3";
import type {
  Spectrum,
  SpectrumGraph,
  SpectrumNode,
  SimilarityLink,
} from "./types";

export interface RenderNetworkOptions {
  /** called when the user clicks a node */
  onSelect: (spectrum: Spectrum) => void;
}

/**
 * Render the spectrum-similarity network as a force-directed graph.
 *
 * This is the graphs module made concrete: nodes repel each other, linked
 * nodes are pulled together, and the layout settles into clusters. Each node
 * is coloured by its **identified peptide** — so if cosine similarity really
 * tracks identity, the clusters and the colours agree. That visual agreement
 * is the verification story of Session 3.
 *
 * Click a node and `onSelect` fires with its spectrum — that is how the
 * network panel drives the detail panel.
 */
export function renderNetwork(
  container: HTMLElement,
  graph: SpectrumGraph,
  options: RenderNetworkOptions,
): void {
  const width = 700;
  const height = 600;

  // one colour per peptide — colour encodes a CATEGORY, which is its strength.
  // With ~25 peptides the standard 10-colour palettes wrap; sample the rainbow
  // for distinct, perceptually-distinguishable hues instead.
  const peptides = Array.from(
    new Set(graph.nodes.map((n) => n.spectrum.peptide ?? "unknown")),
  ).sort();
  const palette = d3.quantize(
    (t) => d3.interpolateRainbow(t * 0.95 + 0.025),
    peptides.length,
  );
  const color = d3.scaleOrdinal<string, string>().domain(peptides).range(palette);

  d3.select(container).selectAll("*").remove(); // clear, so re-renders stay clean

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .style("cursor", "grab");

  // one <g> that receives the zoom transform, keeping the SVG viewBox fixed
  const g = svg.append("g");

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 10])
    .on("zoom", (event) => {
      g.attr("transform", event.transform.toString());
    });

  svg.call(zoom).on("dblclick.zoom", null);

  // working copies — d3-force mutates the node and link objects in place
  const nodes: SpectrumNode[] = graph.nodes.map((n) => ({ ...n }));
  const links: SimilarityLink[] = graph.links.map((l) => ({ ...l }));

  // force parameters tuned for a few hundred nodes
  const simulation = d3
    .forceSimulation<SpectrumNode, SimilarityLink>(nodes)
    .force(
      "link",
      d3
        .forceLink<SpectrumNode, SimilarityLink>(links)
        .id((d) => d.id)
        .distance(22)
        .strength((l) => l.weight),
    )
    .force("charge", d3.forceManyBody<SpectrumNode>().strength(-55))
    .force("center", d3.forceCenter<SpectrumNode>(width / 2, height / 2))
    .force("collide", d3.forceCollide<SpectrumNode>(7));

  const link = g
    .append("g")
    .attr("stroke", "#c4c9d2")
    .attr("stroke-opacity", 0.75)
    .selectAll<SVGLineElement, SimilarityLink>("line")
    .data(links)
    .join("line")
    .attr("stroke-width", (l) => 0.5 + l.weight * 1.6);

  const node = g
    .append("g")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 1.1)
    .selectAll<SVGCircleElement, SpectrumNode>("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 5.5)
    .attr("fill", (d) => color(d.spectrum.peptide ?? "unknown"))
    .attr("cursor", "pointer")
    .on("click", (_event, d) => options.onSelect(d.spectrum))
    .call(drag(simulation));

  node
    .append("title")
    .text((d) => `${d.spectrum.title}\n${d.spectrum.peptide ?? "unidentified"}`);

  simulation.on("tick", () => {
    link
      .attr("x1", (l) => (l.source as SpectrumNode).x ?? 0)
      .attr("y1", (l) => (l.source as SpectrumNode).y ?? 0)
      .attr("x2", (l) => (l.target as SpectrumNode).x ?? 0)
      .attr("y2", (l) => (l.target as SpectrumNode).y ?? 0);
    node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
  });
}

/** Drag behaviour — grab a node, and the simulation reheats around it. */
function drag(simulation: d3.Simulation<SpectrumNode, SimilarityLink>) {
  return d3
    .drag<SVGCircleElement, SpectrumNode>()
    .on("start", (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}
