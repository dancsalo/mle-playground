<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { Point, QueryState, BuildPhase } from '$lib/hnsw';

  let { 
    points, 
    queryState,
    buildPhase = { stage: 'idle', progress: 0 } as BuildPhase,
    numSubspaces = 4,
    width = 280,
    height = 260 
  }: { 
    points: Point[];
    queryState: QueryState | null;
    buildPhase?: BuildPhase;
    numSubspaces?: number;
    width?: number;
    height?: number;
  } = $props();

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  const margin = { top: 6, right: 6, bottom: 6, left: 6 };
  const VIS_SUBSPACES = 4; // always show 4 for demonstration

  const SUBSPACE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
  const CENTROID_COLOR = '#1F2937';
  const QUERY_COLOR = '#FF6B6B';
  const HIGHLIGHT_COLOR = '#F59E0B';

  // Seeded random
  function sRng(seed: number) {
    let s = seed >>> 0;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
  }

  // Generate stable centroids for each subspace
  const NUM_CENTROIDS = 6;
  function getCentroids(subIdx: number) {
    const rng = sRng(7777 + subIdx * 131);
    const centroids: { x: number; y: number }[] = [];
    for (let i = 0; i < NUM_CENTROIDS; i++) {
      centroids.push({ x: 0.1 + rng() * 0.8, y: 0.1 + rng() * 0.8 });
    }
    return centroids;
  }

  // Generate scatter points for each subspace
  function getScatterPoints(subIdx: number, count: number) {
    const rng = sRng(9999 + subIdx * 57);
    const centroids = getCentroids(subIdx);
    const pts: { x: number; y: number; cluster: number }[] = [];
    for (let i = 0; i < count; i++) {
      // Cluster points around centroids
      const c = Math.floor(rng() * centroids.length);
      const spread = 0.08;
      pts.push({
        x: Math.max(0.05, Math.min(0.95, centroids[c].x + (rng() - 0.5) * spread * 2)),
        y: Math.max(0.05, Math.min(0.95, centroids[c].y + (rng() - 0.5) * spread * 2)),
        cluster: c
      });
    }
    return pts;
  }

  onMount(() => {
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('class', 'grid-group');

    update();
  });

  $effect(() => {
    const _qs = queryState;
    const _pts = points;
    const _bp = buildPhase;
    if (svg) update();
  });

  function update() {
    const innerWidth  = width  - margin.left - margin.right;
    const innerHeight = height - margin.top  - margin.bottom;
    const g = svg.select('.grid-group');
    g.selectAll('*').remove();

    const isPQBuild = buildPhase.stage === 'pq';
    const isPQDone = buildPhase.stage === 'hnsw' || buildPhase.stage === 'complete';
    const isSearchActive = queryState?.stage === 'pq' || queryState?.stage === 'hnsw' || 
                           queryState?.stage === 'exact' || queryState?.stage === 'complete';
    const trainedCount = buildPhase.pq?.trainedSubspaces ?? (isPQDone ? VIS_SUBSPACES : 0);

    // ─── Title row ──────────────────────────────────────────────────────────
    const titleH = 14;
    g.append('text')
      .attr('x', innerWidth / 2).attr('y', 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px').attr('fill', '#6B7280')
      .text(isSearchActive ? 'Query → nearest centroid per subspace' :
            isPQBuild ? 'Training codebooks...' :
            trainedCount >= VIS_SUBSPACES ? `${VIS_SUBSPACES} subspace codebooks (32-d each)` :
            'Subspace codebooks (untrained)');

    // ─── 2×2 grid of subspace mini-scatters ─────────────────────────────────
    const gridGap = 6;
    const gridTop = titleH + 4;
    const cellW = (innerWidth - gridGap) / 2;
    const cellH = (innerHeight - gridTop - gridGap - 36) / 2; // reserve 36px for bottom

    for (let s = 0; s < VIS_SUBSPACES; s++) {
      const col = s % 2;
      const row = Math.floor(s / 2);
      const cx = col * (cellW + gridGap);
      const cy = gridTop + row * (cellH + gridGap);

      const isTrained = s < trainedCount;
      const isTraining = isPQBuild && s === Math.min(trainedCount, VIS_SUBSPACES - 1);

      // Cell background
      g.append('rect')
        .attr('x', cx).attr('y', cy)
        .attr('width', cellW).attr('height', cellH)
        .attr('fill', isTrained ? '#FAFAFA' : '#F9FAFB')
        .attr('stroke', isTraining ? SUBSPACE_COLORS[s] : (isTrained ? '#E5E7EB' : '#F3F4F6'))
        .attr('stroke-width', isTraining ? 2 : 1)
        .attr('rx', 4);

      // Subspace label
      g.append('text')
        .attr('x', cx + 4).attr('y', cy + 10)
        .attr('font-size', '7px').attr('font-weight', '700')
        .attr('fill', SUBSPACE_COLORS[s])
        .text(`s${s + 1}`);

      // Status indicator
      if (isTrained && !isTraining) {
        g.append('text')
          .attr('x', cx + cellW - 4).attr('y', cy + 10)
          .attr('text-anchor', 'end')
          .attr('font-size', '7px').attr('fill', '#10B981')
          .text('✓');
      }

      const plotPad = 12;
      const plotX = cx + 3;
      const plotY = cy + plotPad;
      const plotW = cellW - 6;
      const plotH = cellH - plotPad - 3;

      const xScale = d3.scaleLinear().domain([0, 1]).range([plotX, plotX + plotW]);
      const yScale = d3.scaleLinear().domain([0, 1]).range([plotY + plotH, plotY]);

      const centroids = getCentroids(s);

      if (!isTrained && !isTraining) {
        // Untrained: show faint random dots
        const scatterPts = getScatterPoints(s, 15);
        for (const pt of scatterPts) {
          g.append('circle')
            .attr('cx', xScale(pt.x)).attr('cy', yScale(pt.y))
            .attr('r', 1.5)
            .attr('fill', '#D1D5DB')
            .attr('fill-opacity', 0.5);
        }
        continue;
      }

      // Trained/Training: show data points colored by cluster + centroids

      // Voronoi-like colored regions (subtle)
      for (const c of centroids) {
        g.append('circle')
          .attr('cx', xScale(c.x)).attr('cy', yScale(c.y))
          .attr('r', Math.min(plotW, plotH) * 0.15)
          .attr('fill', SUBSPACE_COLORS[s])
          .attr('fill-opacity', 0.06);
      }

      // Data points
      const scatterPts = getScatterPoints(s, 20);
      for (const pt of scatterPts) {
        g.append('circle')
          .attr('cx', xScale(pt.x)).attr('cy', yScale(pt.y))
          .attr('r', 1.5)
          .attr('fill', SUBSPACE_COLORS[s])
          .attr('fill-opacity', isTraining ? 0.4 : 0.5);

        // Assignment lines (sparse, only when trained)
        if (isTrained && Math.random() < 0.3) {
          const nearest = centroids[pt.cluster];
          g.append('line')
            .attr('x1', xScale(pt.x)).attr('y1', yScale(pt.y))
            .attr('x2', xScale(nearest.x)).attr('y2', yScale(nearest.y))
            .attr('stroke', SUBSPACE_COLORS[s])
            .attr('stroke-width', 0.3)
            .attr('stroke-opacity', 0.25);
        }
      }

      // Centroids
      for (let c = 0; c < centroids.length; c++) {
        const centroid = centroids[c];
        g.append('circle')
          .attr('cx', xScale(centroid.x)).attr('cy', yScale(centroid.y))
          .attr('r', isTrained ? 4 : 2.5)
          .attr('fill', isTrained ? CENTROID_COLOR : '#9CA3AF')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);

        if (isTrained) {
          g.append('text')
            .attr('x', xScale(centroid.x)).attr('y', yScale(centroid.y) + 2.5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '5px').attr('fill', '#fff').attr('font-weight', '700')
            .text(`${c}`);
        }
      }

      // During SEARCH: show query subvector finding nearest centroid
      if (isSearchActive) {
        const qRng = sRng(4242 + s * 13);
        const qx = 0.3 + qRng() * 0.4;
        const qy = 0.3 + qRng() * 0.4;

        // Find nearest centroid
        let nearestC = 0;
        let nearestDist = Infinity;
        for (let c = 0; c < centroids.length; c++) {
          const d = (qx - centroids[c].x) ** 2 + (qy - centroids[c].y) ** 2;
          if (d < nearestDist) { nearestDist = d; nearestC = c; }
        }

        const qPx = xScale(qx);
        const qPy = yScale(qy);
        const ncx = xScale(centroids[nearestC].x);
        const ncy = yScale(centroids[nearestC].y);

        // Highlight nearest centroid
        g.append('circle')
          .attr('cx', ncx).attr('cy', ncy)
          .attr('r', 7)
          .attr('fill', 'none')
          .attr('stroke', HIGHLIGHT_COLOR)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,1');

        // Line from query to centroid
        g.append('line')
          .attr('x1', qPx).attr('y1', qPy)
          .attr('x2', ncx).attr('y2', ncy)
          .attr('stroke', QUERY_COLOR)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,2');

        // Query point
        g.append('circle')
          .attr('cx', qPx).attr('cy', qPy)
          .attr('r', 3.5)
          .attr('fill', QUERY_COLOR)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1);

        // Code label
        g.append('text')
          .attr('x', cx + cellW - 4).attr('y', cy + cellH - 3)
          .attr('text-anchor', 'end')
          .attr('font-size', '6px').attr('font-family', 'monospace')
          .attr('fill', HIGHLIGHT_COLOR).attr('font-weight', '700')
          .text(`→c${nearestC}`);
      }
    }

    // ─── Bottom: compression summary ────────────────────────────────────────
    const botY = gridTop + 2 * (cellH + gridGap) + 2;
    const originalMem = points.length * 128 * 4;
    const compressedMem = points.length * VIS_SUBSPACES;

    if (trainedCount >= VIS_SUBSPACES || isSearchActive) {
      // PQ code output bar
      const codeY = botY;
      const codeLabelW = 42;
      const cellBarW = (innerWidth - codeLabelW - 4) / VIS_SUBSPACES;

      g.append('text')
        .attr('x', 0).attr('y', codeY + 8)
        .attr('font-size', '7px').attr('fill', '#6B7280')
        .text('PQ code:');

      for (let s = 0; s < VIS_SUBSPACES; s++) {
        const x = codeLabelW + s * cellBarW;
        const code = (7 * (s + 1) + 3) % NUM_CENTROIDS;
        g.append('rect')
          .attr('x', x).attr('y', codeY)
          .attr('width', cellBarW - 2).attr('height', 12)
          .attr('fill', SUBSPACE_COLORS[s]).attr('fill-opacity', 0.7)
          .attr('rx', 2);
        g.append('text')
          .attr('x', x + (cellBarW - 2) / 2).attr('y', codeY + 9)
          .attr('text-anchor', 'middle')
          .attr('font-size', '7px').attr('font-family', 'monospace')
          .attr('fill', '#fff').attr('font-weight', '600')
          .text(`${code}`);
      }

      // Compression line
      g.append('text')
        .attr('x', innerWidth / 2).attr('y', codeY + 26)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px').attr('fill', '#059669').attr('font-weight', '600')
        .text(`${(originalMem/1024).toFixed(0)}KB → ${(compressedMem/1024).toFixed(1)}KB (${Math.round(originalMem/compressedMem)}× compression)`);
    } else {
      g.append('text')
        .attr('x', innerWidth / 2).attr('y', botY + 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px').attr('fill', '#9CA3AF')
        .text(`128-d vector → ${VIS_SUBSPACES} subvectors of ${Math.round(128/VIS_SUBSPACES)}-d → ${VIS_SUBSPACES} bytes`);
    }
  }
</script>

<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
  <h3 class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
    2. Product Quantization
  </h3>
  <div bind:this={container} class="flex justify-center"></div>
  <!-- Step log -->
  <div class="mt-1 max-h-[44px] overflow-y-auto rounded bg-gray-50 px-2 py-1 text-[10px] font-mono text-gray-500 leading-tight">
    {#if buildPhase.stage === 'pq' && buildPhase.pq}
      <div>Training subspace {buildPhase.pq.trainedSubspaces}/{VIS_SUBSPACES}</div>
      <div>k-means on 32-d subvectors → {NUM_CENTROIDS} centroids</div>
    {:else if queryState?.stage === 'pq' || queryState?.stage === 'hnsw' || queryState?.stage === 'exact' || queryState?.stage === 'complete'}
      <div>Lookup: q_subvec → nearest centroid × {VIS_SUBSPACES}</div>
      <div>Approx dist = Σ table[s][code[s]]</div>
    {:else if buildPhase.stage === 'complete' || buildPhase.stage === 'hnsw'}
      <div>{VIS_SUBSPACES} codebooks trained ({NUM_CENTROIDS} centroids each)</div>
    {:else}
      <div>Split 128-d into {VIS_SUBSPACES} × 32-d subspaces</div>
    {/if}
  </div>
</div>
