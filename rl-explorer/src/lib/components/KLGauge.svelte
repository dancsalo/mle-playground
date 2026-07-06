<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let { 
    klValue, 
    maxKL = 2.0,
    label = 'KL Divergence from Reference'
  }: {
    klValue: number;
    maxKL?: number;
    label?: string;
  } = $props();

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  const width = 260;
  const height = 50;

  onMount(() => {
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    update();
  });

  $effect(() => {
    if (svg) update();
  });

  function getColor(kl: number): string {
    if (kl < maxKL * 0.3) return '#10B981';
    if (kl < maxKL * 0.6) return '#F59E0B';
    return '#EF4444';
  }

  function update() {
    svg.selectAll('*').remove();
    
    const g = svg.append('g').attr('transform', 'translate(10, 10)');
    const barWidth = width - 20;
    const barHeight = 12;
    const clampedKL = Math.min(klValue, maxKL);
    const ratio = clampedKL / maxKL;

    // Background track
    g.append('rect')
      .attr('x', 0)
      .attr('y', 8)
      .attr('width', barWidth)
      .attr('height', barHeight)
      .attr('rx', 6)
      .attr('fill', '#f3f4f6');

    // Gradient zones
    const gradient = svg.append('defs').append('linearGradient')
      .attr('id', `kl-gradient-${Math.random().toString(36).slice(2)}`)
      .attr('x1', '0%').attr('x2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#10B981');
    gradient.append('stop').attr('offset', '50%').attr('stop-color', '#F59E0B');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#EF4444');

    // Filled bar
    g.append('rect')
      .attr('x', 0)
      .attr('y', 8)
      .attr('width', barWidth * ratio)
      .attr('height', barHeight)
      .attr('rx', 6)
      .attr('fill', getColor(klValue));

    // Indicator
    g.append('circle')
      .attr('cx', barWidth * ratio)
      .attr('cy', 14)
      .attr('r', 7)
      .attr('fill', getColor(klValue))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Labels
    g.append('text')
      .attr('x', 0)
      .attr('y', 36)
      .attr('font-size', '9px')
      .attr('fill', '#9ca3af')
      .text('LOW');

    g.append('text')
      .attr('x', barWidth)
      .attr('y', 36)
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('fill', '#9ca3af')
      .text('HIGH');

    g.append('text')
      .attr('x', barWidth / 2)
      .attr('y', 36)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '600')
      .attr('fill', getColor(klValue))
      .text(klValue.toFixed(4));
  }
</script>

<div class="rounded-lg border border-gray-100 bg-white p-3">
  <div class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
  <div bind:this={container}></div>
</div>
