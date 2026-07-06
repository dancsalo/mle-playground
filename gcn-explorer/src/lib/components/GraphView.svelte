<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { Graph, ForwardResult } from '$lib/gcn';

  let {
    graph,
    forwardResult = undefined,
    selectedNode = $bindable(-1),
    highlightLayer = 0,
    showMessages = false,
    mode = 'features'
  }: {
    graph: Graph;
    forwardResult?: ForwardResult;
    selectedNode?: number;
    highlightLayer?: number;
    showMessages?: boolean;
    mode?: 'features' | 'predictions' | 'embeddings';
  } = $props();

  let svgEl: SVGSVGElement;
  let width = 520;
  let height = 400;

  // Force-directed layout positions
  let nodePositions = $state<{ x: number; y: number }[]>([]);

  onMount(() => {
    runLayout();
  });

  function runLayout() {
    const nodes = graph.nodes.map((n, i) => ({ ...n, id: i, x: width / 2, y: height / 2 }));
    const links = graph.edges.map(e => ({ source: e.source, target: e.target }));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(70))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(30));

    // Run synchronously
    sim.stop();
    for (let i = 0; i < 200; i++) sim.tick();

    nodePositions = nodes.map(n => ({ x: n.x!, y: n.y! }));
  }

  // Derive node colors based on mode
  function getNodeColor(nodeId: number): string {
    if (mode === 'predictions' && forwardResult) {
      const predicted = forwardResult.predictedClasses[nodeId];
      return graph.classColors[predicted];
    }
    return graph.classColors[graph.nodes[nodeId].trueClass];
  }

  function getNodeOpacity(nodeId: number): number {
    if (mode === 'predictions' && forwardResult) {
      const probs = forwardResult.predictions[nodeId];
      return 0.4 + 0.6 * Math.max(...probs); // opacity reflects confidence
    }
    return graph.nodes[nodeId].isLabeled ? 1 : 0.6;
  }

  function getNodeStroke(nodeId: number): string {
    if (selectedNode === nodeId) return '#1F2937';
    if (mode === 'predictions' && forwardResult) {
      const predicted = forwardResult.predictedClasses[nodeId];
      const correct = predicted === graph.nodes[nodeId].trueClass;
      return correct ? '#10B981' : '#EF4444';
    }
    return graph.nodes[nodeId].isLabeled ? '#374151' : '#D1D5DB';
  }

  function getNodeStrokeWidth(nodeId: number): number {
    if (selectedNode === nodeId) return 3;
    if (mode === 'predictions') return 2.5;
    return graph.nodes[nodeId].isLabeled ? 2 : 1.5;
  }

  // Messages for animation
  let activeMessages = $derived(
    showMessages && forwardResult
      ? (highlightLayer === 1
          ? forwardResult.layer1.messages
          : forwardResult.layer2.messages)
      : []
  );
</script>

<svg bind:this={svgEl} {width} {height} class="rounded-xl border border-gray-200 bg-white">
  <defs>
    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
      <polygon points="0 0, 6 2, 0 4" fill="#F59E0B" opacity="0.7" />
    </marker>
  </defs>

  <!-- Edges -->
  {#if nodePositions.length > 0}
    {#each graph.edges as edge}
      <line
        x1={nodePositions[edge.source]?.x}
        y1={nodePositions[edge.source]?.y}
        x2={nodePositions[edge.target]?.x}
        y2={nodePositions[edge.target]?.y}
        stroke="#E5E7EB"
        stroke-width="1.5"
        opacity={
          selectedNode >= 0 &&
          edge.source !== selectedNode &&
          edge.target !== selectedNode
            ? 0.2 : 0.8
        }
      />
    {/each}

    <!-- Message arrows (animated) -->
    {#if showMessages && selectedNode >= 0}
      {#each activeMessages.filter(m => m.to === selectedNode) as msg, i}
        <line
          x1={nodePositions[msg.from]?.x}
          y1={nodePositions[msg.from]?.y}
          x2={nodePositions[msg.to]?.x}
          y2={nodePositions[msg.to]?.y}
          stroke="#F59E0B"
          stroke-width="2.5"
          opacity="0.8"
          marker-end="url(#arrowhead)"
          class="message-path"
          style="animation-delay: {i * 200}ms"
        />
      {/each}
    {/if}

    <!-- Nodes -->
    {#each graph.nodes as node, i}
      <g
        class="graph-node"
        class:node-active={selectedNode === i && showMessages}
        transform="translate({nodePositions[i]?.x ?? 0}, {nodePositions[i]?.y ?? 0})"
        onclick={() => selectedNode = selectedNode === i ? -1 : i}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectedNode = selectedNode === i ? -1 : i; }}
        role="button"
        tabindex="0"
      >
        <!-- Node circle -->
        <circle
          r={graph.nodes[i].isLabeled ? 18 : 14}
          fill={getNodeColor(i)}
          opacity={getNodeOpacity(i)}
          stroke={getNodeStroke(i)}
          stroke-width={getNodeStrokeWidth(i)}
        />
        <!-- Label -->
        <text
          text-anchor="middle"
          dy="0.35em"
          font-size={graph.nodes[i].isLabeled ? "9" : "8"}
          font-weight={graph.nodes[i].isLabeled ? "600" : "400"}
          fill="white"
        >
          {node.label.length > 4 ? node.label.slice(0, 4) : node.label}
        </text>
        <!-- Labeled indicator -->
        {#if graph.nodes[i].isLabeled}
          <circle r="4" cx="12" cy="-12" fill="#374151" stroke="white" stroke-width="1" />
          <text x="12" y="-9" text-anchor="middle" font-size="5" fill="white" font-weight="700">L</text>
        {/if}
      </g>
    {/each}
  {/if}

  <!-- Legend -->
  <g transform="translate(10, {height - 60})">
    {#each graph.classNames as cls, i}
      <g transform="translate(0, {i * 18})">
        <circle r="5" cx="5" cy="0" fill={graph.classColors[i]} />
        <text x="15" y="4" font-size="10" fill="#6B7280">{cls}</text>
      </g>
    {/each}
  </g>

  <!-- Mode indicator -->
  <text x={width - 10} y="18" text-anchor="end" font-size="9" fill="#9CA3AF" class="mono">
    {mode === 'features' ? 'Ground Truth' : mode === 'predictions' ? 'Predictions' : 'Embeddings'}
  </text>
</svg>
