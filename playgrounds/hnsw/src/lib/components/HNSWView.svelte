<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { HNSWNode, SearchPath, QueryState, BuildPhase } from '$lib/hnsw';

  let { 
    nodes = [], 
    searchPath = [],
    queryState = null,
    buildPhase = { stage: 'idle', progress: 0 } as BuildPhase,
    numLayers = 3,
    width = 280,
    height = 260 
  }: { 
    nodes?: HNSWNode[];
    searchPath?: SearchPath[];
    queryState?: QueryState | null;
    buildPhase?: BuildPhase;
    numLayers?: number;
    width?: number;
    height?: number;
  } = $props();

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  // Expose for template log
  let showPath = $derived(
    queryState?.stage === 'hnsw' || queryState?.stage === 'exact' || queryState?.stage === 'complete'
  );

  const margin = { top: 10, right: 10, bottom: 10, left: 10 };

  const LAYER_FILLS    = ['#DBEAFE', '#EDE9FE', '#FCE7F3', '#FEF3C7'];
  const LAYER_STROKES  = ['#93C5FD', '#C4B5FD', '#F9A8D4', '#FCD34D'];
  const NODE_COLORS    = ['#2563EB', '#7C3AED', '#DB2777', '#D97706'];
  const PATH_COLOR     = '#7E3AF2';
  const NODE_HIGHLIGHT = '#F59E0B';
  const NEW_NODE_COLOR = '#10B981';

  onMount(() => {
    // Dynamic height based on numLayers so 5 layers don't clip
    const dynHeight = Math.max(height, 40 + numLayers * 56);
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', dynHeight);

    const defs = svg.append('defs');

    // Drop shadow for 3D depth
    const shadow = defs.append('filter')
      .attr('id', 'layer-shadow')
      .attr('x', '-10%').attr('y', '-10%')
      .attr('width', '130%').attr('height', '130%');
    shadow.append('feDropShadow')
      .attr('dx', 0).attr('dy', 2)
      .attr('stdDeviation', 2)
      .attr('flood-color', '#000')
      .attr('flood-opacity', 0.07);

    // Glow for path nodes
    const glow = defs.append('filter')
      .attr('id', 'node-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur')
      .attr('in', 'SourceGraphic').attr('stdDeviation', 2.5)
      .attr('result', 'blur');
    glow.append('feMerge').html(
      '<feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/>'
    );

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('class', 'planes-group');
    g.append('g').attr('class', 'edges-group');
    g.append('g').attr('class', 'nodes-group');
    g.append('g').attr('class', 'path-group');
    g.append('g').attr('class', 'labels-group');
  });

  $effect(() => {
    const _nodes = nodes;
    const _path  = searchPath;
    const _qs    = queryState;
    const _bp    = buildPhase;
    if (svg) render();
  });

  // ─── Helper: map a node (x, y) in [0,1]² into the 2D layer plane ─────────
  // Each layer is a trapezoid that gets smaller/higher for upper layers.
  // Within that trapezoid, nodes are scattered in 2D using both x and y.
  interface LayerBounds {
    // The bounding box for this layer in SVG coordinates
    xMin: number; xMax: number; yMin: number; yMax: number;
  }

  function render() {
    if (!svg) return;

    const innerWidth  = width  - margin.left - margin.right;
    // Dynamic SVG height based on layers
    const dynHeight = Math.max(height, 40 + numLayers * 56);
    svg.attr('height', dynHeight);
    const innerHeight = dynHeight - margin.top - margin.bottom;

    const g = svg.select('g');
    const planesG = g.select('.planes-group');
    const edgesG  = g.select('.edges-group');
    const nodesG  = g.select('.nodes-group');
    const pathG   = g.select('.path-group');
    const labelsG = g.select('.labels-group');

    // ─── 2D layer geometry ──────────────────────────────────────────────────
    // Each layer is a rectangular region. Higher layers are smaller (perspective)
    // and positioned higher. All layers are stacked vertically with some overlap.
    const totalLayerSpace = innerHeight - 10;
    const layerH = totalLayerSpace / (numLayers + 0.3); // height per layer

    function getLayerBounds(layer: number): LayerBounds {
      const t = layer / Math.max(numLayers - 1, 1); // 0=bottom, 1=top
      // Perspective: higher layers are narrower
      const scale = 0.55 + (1 - t) * 0.45; // bottom=1.0, top=0.55
      const w = innerWidth * scale * 0.82;
      const cx = innerWidth / 2;
      // Vertical position: bottom layer at bottom, top layer at top
      const cy = innerHeight - 8 - t * (totalLayerSpace - layerH * 0.7);
      return {
        xMin: cx - w / 2,
        xMax: cx + w / 2,
        yMin: cy - layerH * 0.4,
        yMax: cy + layerH * 0.4
      };
    }

    // Build 2D scales per layer
    function nodePos(node: HNSWNode): { x: number; y: number } {
      const bounds = getLayerBounds(node.layer);
      // Map node.x → horizontal, node.y → vertical within layer bounds
      const px = bounds.xMin + (node.x) * (bounds.xMax - bounds.xMin);
      const py = bounds.yMin + (node.y) * (bounds.yMax - bounds.yMin);
      return { x: px, y: py };
    }

    // ─── Draw layer planes (2D parallelogram/trapezoid for isometric look) ─
    planesG.selectAll('*').remove();
    for (let layer = 0; layer < numLayers; layer++) {
      const b = getLayerBounds(layer);
      const pad = 5;
      // Skew offset gives each plane a slight isometric tilt
      // Higher layers have more skew → looks like stacked 3D platforms
      const skew = (numLayers - 1 - layer) * 3 + 2;
      const x1 = b.xMin - pad;
      const x2 = b.xMax + pad;
      const y1 = b.yMin - pad;
      const y2 = b.yMax + pad;

      // Draw as a parallelogram: top edge shifted right, bottom edge shifted left
      const pts = [
        [x1 + skew, y1],        // top-left
        [x2 + skew, y1],        // top-right
        [x2 - skew, y2],        // bottom-right
        [x1 - skew, y2],        // bottom-left
      ];

      planesG.append('polygon')
        .attr('points', pts.map(p => p.join(',')).join(' '))
        .attr('fill', LAYER_FILLS[layer % LAYER_FILLS.length])
        .attr('stroke', LAYER_STROKES[layer % LAYER_STROKES.length])
        .attr('stroke-width', 1)
        .attr('rx', 4)
        .attr('filter', 'url(#layer-shadow)')
        .attr('opacity', 0.8);
    }

    // ─── State ──────────────────────────────────────────────────────────────
    const isHNSWBuild = buildPhase.stage === 'hnsw';
    const lastInsertedIds = new Set(buildPhase.hnsw?.lastInsertedIds ?? []);

    const pathNodeIds = new Set<number>();
    for (const path of searchPath) {
      path.nodeIds.forEach(nid => pathNodeIds.add(nid));
    }
    const showPath = queryState?.stage === 'hnsw' ||
                     queryState?.stage === 'exact' ||
                     queryState?.stage === 'complete';

    if (!nodes || nodes.length === 0) {
      edgesG.selectAll('*').remove();
      nodesG.selectAll('*').remove();
      pathG.selectAll('*').remove();
      labelsG.selectAll('*').remove();
      for (let layer = 0; layer < numLayers; layer++) {
        const b = getLayerBounds(layer);
        labelsG.append('text')
          .attr('x', b.xMin - 8).attr('y', (b.yMin + b.yMax) / 2 + 3)
          .attr('text-anchor', 'end')
          .attr('font-size', '8px').attr('font-weight', '600')
          .attr('fill', NODE_COLORS[layer % NODE_COLORS.length])
          .text(`L${layer}`);
      }
      return;
    }

    // ─── Draw edges (2D) ────────────────────────────────────────────────────
    edgesG.selectAll('*').remove();
    // During build: show more edges so new connections are visible.
    // After build: limit to reduce clutter.
    const maxEdgesPerLayer = isHNSWBuild ? 60 : 18;
    for (let layer = 0; layer < numLayers; layer++) {
      const layerNodes = nodes.filter(n => n.layer === layer);
      let drawn = 0;
      for (const node of layerNodes) {
        if (drawn >= maxEdgesPerLayer) break;
        const p1 = nodePos(node);
        for (const nid of node.neighbors.slice(0, 3)) {
          if (drawn >= maxEdgesPerLayer) break;
          const nb = nodes.find(n => n.id === nid && n.layer === layer);
          if (nb) {
            const p2 = nodePos(nb);
            // Highlight ALL edges connected to newly inserted nodes in green
            const isNewEdge = isHNSWBuild && (lastInsertedIds.has(node.pointId) || lastInsertedIds.has(nb.pointId));
            edgesG.append('line')
              .attr('x1', p1.x).attr('y1', p1.y)
              .attr('x2', p2.x).attr('y2', p2.y)
              .attr('stroke', isNewEdge ? NEW_NODE_COLOR : LAYER_STROKES[layer % LAYER_STROKES.length])
              .attr('stroke-width', isNewEdge ? 2 : 0.5)
              .attr('opacity', isNewEdge ? 0.9 : 0.25);
            drawn++;
          }
        }
      }
    }

    // ─── Draw nodes (2D scattered, sampled to reduce clutter) ───────────────
    nodesG.selectAll('*').remove();
    // During build: show ALL nodes (no sampling) so positions stay static.
    // After build: sample to reduce visual clutter.
    const MAX_SHOWN = [22, 14, 9, 6];

    for (let layer = 0; layer < numLayers; layer++) {
      const layerNodes = nodes.filter(n => n.layer === layer);
      const maxShow = isHNSWBuild ? 9999 : MAX_SHOWN[Math.min(layer, MAX_SHOWN.length - 1)];
      const step = Math.max(1, Math.floor(layerNodes.length / maxShow));

      for (let i = 0; i < layerNodes.length; i += step) {
        const node = layerNodes[i];
        const inPath = showPath && pathNodeIds.has(node.id);
        const isNew = isHNSWBuild && lastInsertedIds.has(node.pointId);
        if (inPath || isNew) continue; // draw these separately on top
        const pos = nodePos(node);
        const r = layer === 0 ? 2.5 : 2;

        nodesG.append('circle')
          .attr('cx', pos.x).attr('cy', pos.y)
          .attr('r', r)
          .attr('fill', NODE_COLORS[layer % NODE_COLORS.length])
          .attr('fill-opacity', 0.45);
      }

      // Draw highlighted nodes on top (new + path)
      for (const node of layerNodes) {
        const inPath = showPath && pathNodeIds.has(node.id);
        const isNew = isHNSWBuild && lastInsertedIds.has(node.pointId);
        if (!inPath && !isNew) continue;
        const pos = nodePos(node);
        nodesG.append('circle')
          .attr('cx', pos.x).attr('cy', pos.y)
          .attr('r', inPath ? 5 : 5)
          .attr('fill', inPath ? NODE_HIGHLIGHT : NEW_NODE_COLOR)
          .attr('stroke', '#fff').attr('stroke-width', 2)
          .attr('filter', inPath ? 'url(#node-glow)' : 'none');
      }
    }

    // ─── Search path with 2D connections + proximity labels ─────────────────
    pathG.selectAll('*').remove();
    if (showPath && searchPath.length > 0) {
      interface PathNode { nodeId: number; layer: number; dist: number; x: number; y: number; }
      const allPathNodes: PathNode[] = [];

      for (const path of searchPath) {
        const layer = path.layer;
        const layerPathNodes = path.nodeIds
          .map((nid, idx) => {
            const node = nodes.find(n => n.id === nid && n.layer === layer);
            if (!node) return null;
            const pos = nodePos(node);
            return { nodeId: nid, layer, dist: path.distances[idx] ?? 0, x: pos.x, y: pos.y };
          })
          .filter((n): n is PathNode => n !== null);

        allPathNodes.push(...layerPathNodes);

        // Draw dashed connecting line within layer
        if (layerPathNodes.length >= 2) {
          pathG.append('line')
            .attr('x1', layerPathNodes[0].x).attr('y1', layerPathNodes[0].y)
            .attr('x2', layerPathNodes[layerPathNodes.length - 1].x)
            .attr('y2', layerPathNodes[layerPathNodes.length - 1].y)
            .attr('stroke', PATH_COLOR).attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,3').attr('opacity', 0.7);
        }
      }

      // Inter-layer descent arrows
      for (let i = 0; i < searchPath.length - 1; i++) {
        const fromPath = searchPath[i];
        const toPath   = searchPath[i + 1];
        const lastFrom = nodes.find(n => n.id === fromPath.nodeIds[fromPath.nodeIds.length - 1] && n.layer === fromPath.layer);
        const firstTo  = nodes.find(n => n.id === toPath.nodeIds[0] && n.layer === toPath.layer);
        if (lastFrom && firstTo) {
          const p1 = nodePos(lastFrom);
          const p2 = nodePos(firstTo);
          pathG.append('line')
            .attr('x1', p1.x).attr('y1', p1.y)
            .attr('x2', p2.x).attr('y2', p2.y)
            .attr('stroke', PATH_COLOR).attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '3,3').attr('opacity', 0.45);
          // Arrowhead
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const al = 6;
          pathG.append('polygon')
            .attr('points', [
              [p2.x, p2.y],
              [p2.x - al * Math.cos(angle - 0.4), p2.y - al * Math.sin(angle - 0.4)],
              [p2.x - al * Math.cos(angle + 0.4), p2.y - al * Math.sin(angle + 0.4)]
            ].map(p => p.join(',')).join(' '))
            .attr('fill', PATH_COLOR).attr('opacity', 0.5);
        }
      }

      // Traversal-order indices (1 = first visited = top layer, N = last = bottom)
      // searchPath is already ordered top→bottom, so allPathNodes preserves that order.
      const orderedPathNodes = allPathNodes.filter((n, i, arr) =>
        arr.findIndex(m => m.nodeId === n.nodeId) === i
      );
      // DO NOT sort by distance — keep traversal order (top layer first)

      for (let idx = 0; idx < orderedPathNodes.length; idx++) {
        const pn = orderedPathNodes[idx];
        // Badge circle
        pathG.append('circle')
          .attr('cx', pn.x + 8).attr('cy', pn.y - 8)
          .attr('r', 7).attr('fill', PATH_COLOR).attr('stroke', '#fff').attr('stroke-width', 1);
        // Step number (traversal order)
        pathG.append('text')
          .attr('x', pn.x + 8).attr('y', pn.y - 5)
          .attr('text-anchor', 'middle')
          .attr('font-size', '7px').attr('font-weight', '700').attr('fill', '#fff')
          .text(`${idx + 1}`);
      }
    }

    // ─── Layer labels ───────────────────────────────────────────────────────
    labelsG.selectAll('*').remove();
    for (let layer = 0; layer < numLayers; layer++) {
      const b = getLayerBounds(layer);
      const count = nodes.filter(n => n.layer === layer).length;

      labelsG.append('text')
        .attr('x', b.xMin - 8).attr('y', (b.yMin + b.yMax) / 2)
        .attr('text-anchor', 'end')
        .attr('font-size', '8px').attr('font-weight', '600')
        .attr('fill', NODE_COLORS[layer % NODE_COLORS.length])
        .text(`L${layer}`);
      labelsG.append('text')
        .attr('x', b.xMin - 8).attr('y', (b.yMin + b.yMax) / 2 + 10)
        .attr('text-anchor', 'end')
        .attr('font-size', '7px').attr('fill', '#9CA3AF')
        .text(`${count}`);
    }
  }
</script>

<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
  <h3 class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
    3. HNSW Graph Traversal
  </h3>
  <div bind:this={container} class="flex justify-center"></div>
  <!-- Step log -->
  <div class="mt-1 max-h-[52px] overflow-y-auto rounded bg-gray-50 px-2 py-1 text-[10px] font-mono text-gray-500 leading-tight">
    {#if buildPhase.stage === 'hnsw' && buildPhase.hnsw}
      <div>Inserting nodes... {buildPhase.hnsw.insertedPoints}/{buildPhase.hnsw.totalPoints}</div>
      <div>Edges: {buildPhase.hnsw.edgeCount} • Max layer: {buildPhase.hnsw.currentLayer}</div>
    {:else if showPath && searchPath.length > 0}
      {#each searchPath as path, i}
        <div class="{i === searchPath.length - 1 ? 'text-purple-600 font-semibold' : ''}">
          Step {i + 1}: L{path.layer} → greedy search → d={path.distances[path.distances.length-1]?.toFixed(3)}
        </div>
      {/each}
    {:else}
      <div>{numLayers} layers • {nodes.filter(n => n.layer === 0).length} base nodes</div>
    {/if}
  </div>
</div>
