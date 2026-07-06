<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { Point, Cluster, QueryState, BuildPhase } from '$lib/hnsw';

  let { 
    points = [], 
    clusters = [], 
    queryState = null,
    buildPhase = { stage: 'idle', progress: 0 } as BuildPhase,
    showQuery = false,
    width = 280,
    height = 260 
  }: { 
    points?: Point[]; 
    clusters?: Cluster[];
    queryState?: QueryState | null;
    buildPhase?: BuildPhase;
    showQuery?: boolean;
    width?: number;
    height?: number;
  } = $props();

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let initialized = false;

  const margin = { top: 15, right: 15, bottom: 25, left: 25 };
  
  const CLUSTER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
                           '#06B6D4', '#84CC16', '#F97316', '#A855F7', '#E11D48', '#14B8A6'];
  const QUERY_COLOR = '#FF6B6B';
  const UNASSIGNED_COLOR = '#9CA3AF';

  onMount(() => {
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('class', 'clusters-group');
    g.append('g').attr('class', 'points-group');
    g.append('g').attr('class', 'centroids-group');
    g.append('g').attr('class', 'query-group');

    // Axes
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(d3.scaleLinear().domain([0,1]).range([0, innerWidth])).ticks(5).tickSize(3))
      .selectAll('text').attr('font-size', '9px').attr('fill', '#9CA3AF');
    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(d3.scaleLinear().domain([0,1]).range([innerHeight, 0])).ticks(5).tickSize(3))
      .selectAll('text').attr('font-size', '9px').attr('fill', '#9CA3AF');
    g.selectAll('.domain').attr('stroke', '#E5E7EB');
    
    initialized = true;
    render();
  });

  $effect(() => {
    const _pts = points;
    const _cls = clusters;
    const _qs  = queryState;
    const _bp  = buildPhase;
    const _sq  = showQuery;
    if (initialized && svg) render();
  });

  function render() {
    if (!svg) return;
    if (!points || points.length === 0) return;
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

    const g = svg.select('g');
    const clustersG = g.select('.clusters-group');
    const pointsG = g.select('.points-group');
    const centroidsG = g.select('.centroids-group');
    const queryG = g.select('.query-group');

    const isBuildingKmeans = buildPhase.stage === 'kmeans';
    const hasClusters = clusters && clusters.length > 0;

    // ── Cluster boundaries ──────────────────────────────────────────────────
    clustersG.selectAll('*').remove();
    if (hasClusters) {
      for (const cluster of clusters) {
        const radius = Math.sqrt(cluster.points.length / points.length) * innerWidth * 0.45;
        clustersG.append('circle')
          .attr('cx', xScale(cluster.centroid.x))
          .attr('cy', yScale(cluster.centroid.y))
          .attr('r', radius)
          .attr('fill', CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length])
          .attr('fill-opacity', isBuildingKmeans ? 0.06 : 0.1)
          .attr('stroke', CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length])
          .attr('stroke-width', isBuildingKmeans ? 2 : 1.5)
          .attr('stroke-opacity', isBuildingKmeans ? 0.7 : 0.5)
          .attr('stroke-dasharray', isBuildingKmeans ? '4,3' : 'none');
      }
    }

    // ── Points ──────────────────────────────────────────────────────────────
    pointsG.selectAll('circle').remove();
    pointsG.selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 3.5)
      .attr('fill', d => {
        if (!hasClusters) return UNASSIGNED_COLOR;
        return CLUSTER_COLORS[d.clusterId % CLUSTER_COLORS.length];
      })
      .attr('fill-opacity', d => {
        if (!hasClusters) return 0.4; // gray dots before build
        if (!queryState) return 0.7;
        if (queryState.ivfCandidates.includes(d.id)) return 1;
        if (queryState.stage !== 'idle' && queryState.stage !== 'ivf') return 0.15;
        return 0.7;
      })
      .attr('opacity', d => {
        if (!queryState) return 1;
        if (queryState.stage === 'pq' || queryState.stage === 'hnsw' || queryState.stage === 'exact' || queryState.stage === 'complete') {
          if (!queryState.ivfCandidates.includes(d.id)) return 0.15;
        }
        return 1;
      });

    // ── Centroids ───────────────────────────────────────────────────────────
    centroidsG.selectAll('*').remove();
    if (hasClusters) {
      // Keep probed clusters highlighted throughout the entire search (not just IVF stage)
      const highlightedClusterIds = (queryState && queryState.ivfCandidates.length > 0)
        ? new Set(clusters.filter(c => c.points.some(p => queryState?.ivfCandidates.includes(p))).map(c => c.id))
        : new Set<number>();
      
      for (const cluster of clusters) {
        const isHighlighted = highlightedClusterIds.has(cluster.id);
        
        // During k-means build, show centroids as stars
        if (isBuildingKmeans) {
          // Star/diamond marker for centroid
          const cx = xScale(cluster.centroid.x);
          const cy = yScale(cluster.centroid.y);
          const s = 7;
          centroidsG.append('polygon')
            .attr('points', `${cx},${cy-s} ${cx+s*0.3},${cy-s*0.3} ${cx+s},${cy} ${cx+s*0.3},${cy+s*0.3} ${cx},${cy+s} ${cx-s*0.3},${cy+s*0.3} ${cx-s},${cy} ${cx-s*0.3},${cy-s*0.3}`)
            .attr('fill', CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length])
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);
        } else {
          centroidsG.append('circle')
            .attr('cx', xScale(cluster.centroid.x))
            .attr('cy', yScale(cluster.centroid.y))
            .attr('r', isHighlighted ? 9 : 6)
            .attr('fill', isHighlighted ? QUERY_COLOR : CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length])
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('opacity', isHighlighted ? 1 : 0.8);
        }
      }
    }

    // ── Query point ─────────────────────────────────────────────────────────
    queryG.selectAll('*').remove();
    if (showQuery) {
      if (queryState && queryState.stage !== 'idle') {
        queryG.append('circle')
          .attr('cx', xScale(0.5)).attr('cy', yScale(0.5))
          .attr('r', 10)
          .attr('fill', 'none')
          .attr('stroke', QUERY_COLOR)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.4);
      }
      queryG.append('circle')
        .attr('cx', xScale(0.5)).attr('cy', yScale(0.5))
        .attr('r', 6)
        .attr('fill', QUERY_COLOR)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
      queryG.append('text')
        .attr('x', xScale(0.5) + 9).attr('y', yScale(0.5) + 4)
        .attr('font-size', '9px').attr('font-weight', '700')
        .attr('fill', QUERY_COLOR)
        .text('Q');
    }
  }
</script>

<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
  <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
    1. IVF Partitioning
  </h3>
  <div bind:this={container} class="flex justify-center"></div>
  <!-- Step log -->
  <div class="mt-1 max-h-[52px] overflow-y-auto rounded bg-gray-50 px-2 py-1 text-[10px] font-mono text-gray-500 leading-tight">
    {#if buildPhase.stage === 'kmeans' && buildPhase.kmeans}
      <div>k-means iter {buildPhase.kmeans.iteration}/{buildPhase.kmeans.maxIterations}</div>
      <div>{clusters.length} centroids placed, assigning {points.length} points</div>
      {#if buildPhase.kmeans.converged}<div class="text-green-600">Converged!</div>{/if}
    {:else if queryState && queryState.ivfCandidates.length > 0}
      <div>Probed {new Set(clusters.filter(c => c.points.some(p => queryState?.ivfCandidates.includes(p))).map(c => c.id)).size} nearest partitions</div>
      <div>Candidates: {queryState.ivfCandidates.length}/{points.length} vectors ({(queryState.ivfCandidates.length / points.length * 100).toFixed(0)}%)</div>
    {:else}
      <div>{clusters.length} partitions • {points.length} vectors</div>
    {/if}
  </div>
</div>
