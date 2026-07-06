<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { sCurveData, sCurve, type DocumentData } from '$lib/lsh';

  let { numBands, rowsPerBand, pairSimilarities, documents }: {
    numBands: number;
    rowsPerBand: number;
    pairSimilarities: { docA: number; docB: number; jaccard: number; sigSim: number }[];
    documents: DocumentData[];
  } = $props();

  let container: HTMLDivElement;
  let inspectPoint: { s: number; p: number } | null = $state(null);

  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 700;
  const height = 320;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let xScale: d3.ScaleLinear<number, number>;
  let yScale: d3.ScaleLinear<number, number>;

  onMount(() => {
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Scales
    xScale = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
    yScale = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

    // Axes
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(10));

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(10));

    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280')
      .text('Similarity (s)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280')
      .text('P(candidate pair)');

    // Grid line at P=0.5 threshold
    g.append('line')
      .attr('class', 'threshold-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0.5))
      .attr('y2', yScale(0.5))
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    g.append('text')
      .attr('class', 'threshold-label')
      .attr('x', innerWidth - 4)
      .attr('y', yScale(0.5) - 4)
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('fill', '#9ca3af')
      .text('P=0.5');

    // S-curve path group
    g.append('path').attr('class', 's-curve');

    // Pair markers group
    g.append('g').attr('class', 'pair-markers');

    // Inspect line group
    g.append('g').attr('class', 'inspect-group');

    // Click handler for inspect
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('click', (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const s = xScale.invert(mx);
        const p = sCurve(s, numBands, rowsPerBand);
        inspectPoint = { s: Math.max(0, Math.min(1, s)), p };
      });

    update();
  });

  $effect(() => {
    if (svg) update();
  });

  function update() {
    const g = svg.select<SVGGElement>('g');
    const data = sCurveData(numBands, rowsPerBand);

    // Update S-curve
    const line = d3.line<{ s: number; p: number }>()
      .x((d) => xScale(d.s))
      .y((d) => yScale(d.p))
      .curve(d3.curveMonotoneX);

    g.select('.s-curve')
      .datum(data)
      .attr('d', line as any)
      .attr('fill', 'none')
      .attr('stroke', '#7E3AF2')
      .attr('stroke-width', 2.5);

    // Update pair markers
    const markers = g.select('.pair-markers');
    markers.selectAll('*').remove();

    for (const pair of pairSimilarities) {
      const s = pair.jaccard;
      const p = sCurve(s, numBands, rowsPerBand);
      const colorA = documents[pair.docA].color;
      const colorB = documents[pair.docB].color;

      // Vertical line from axis to curve
      markers.append('line')
        .attr('x1', xScale(s))
        .attr('x2', xScale(s))
        .attr('y1', yScale(0))
        .attr('y2', yScale(p))
        .attr('stroke', '#d1d5db')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');

      // Dot on curve
      markers.append('circle')
        .attr('cx', xScale(s))
        .attr('cy', yScale(p))
        .attr('r', 5)
        .attr('fill', '#7E3AF2')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);

      // Label
      markers.append('text')
        .attr('x', xScale(s))
        .attr('y', yScale(p) - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#374151')
        .text(`${documents[pair.docA].label}↔${documents[pair.docB].label}`);
    }

    // Update inspect point
    const inspectG = g.select('.inspect-group');
    inspectG.selectAll('*').remove();

    if (inspectPoint) {
      inspectG.append('line')
        .attr('x1', xScale(inspectPoint.s))
        .attr('x2', xScale(inspectPoint.s))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3');

      inspectG.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(inspectPoint.p))
        .attr('y2', yScale(inspectPoint.p))
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3');

      inspectG.append('circle')
        .attr('cx', xScale(inspectPoint.s))
        .attr('cy', yScale(inspectPoint.p))
        .attr('r', 6)
        .attr('fill', '#f59e0b')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      inspectG.append('text')
        .attr('x', xScale(inspectPoint.s) + 10)
        .attr('y', yScale(inspectPoint.p) - 5)
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#374151')
        .text(`s=${inspectPoint.s.toFixed(2)} → P=${inspectPoint.p.toFixed(3)}`);
    }
  }
</script>

<div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
  <div bind:this={container} class="flex justify-center"></div>
  {#if inspectPoint}
    <div class="mono mt-2 text-center text-xs text-gray-500">
      Click anywhere on the chart to inspect. At similarity <strong>{inspectPoint.s.toFixed(2)}</strong>,
      P(candidate) = <strong class="text-[var(--lsh-primary)]">{inspectPoint.p.toFixed(4)}</strong>
    </div>
  {:else}
    <div class="mt-2 text-center text-xs text-gray-400">
      Click on the chart to inspect probability at any similarity value
    </div>
  {/if}
</div>
