<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import { arrayState, highlights, arraySize } from '../stores/sortStore.js';

  export let width = 800;
  export let height = 400;

  let container;
  let svg;

  const margin = { top: 20, right: 20, bottom: 30, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  $: barWidth = $arrayState.length > 0 ? innerWidth / $arrayState.length : 0;

  $: xScale = d3.scaleBand()
    .domain($arrayState.map((_, i) => i))
    .range([0, innerWidth])
    .padding(0.1);

  $: yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([innerHeight, 0]);

  function getBarColor(index) {
    const h = $highlights;
    if (h.sorted && h.sorted.includes(index)) return '#4ade80'; // green
    if (h.swapping && h.swapping.includes(index)) return '#f87171'; // red
    if (h.comparing && h.comparing.includes(index)) return '#fbbf24'; // yellow
    if (h.pivot === index) return '#a78bfa'; // purple
    if (h.active && h.active.includes(index)) return '#60a5fa'; // blue
    return '#6366f1'; // indigo default
  }

  onMount(() => {
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  });

  $: if (svg && $arrayState.length > 0) {
    updateBars($arrayState, $highlights);
  }

  function updateBars(data, hl) {
    const xS = d3.scaleBand()
      .domain(data.map((_, i) => i))
      .range([0, innerWidth])
      .padding(0.1);

    const yS = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    const bars = svg.selectAll('rect').data(data, (d, i) => i);

    bars.enter()
      .append('rect')
      .merge(bars)
      .attr('x', (d, i) => xS(i))
      .attr('y', d => yS(d.value))
      .attr('width', xS.bandwidth())
      .attr('height', d => innerHeight - yS(d.value))
      .attr('rx', 2)
      .attr('fill', (d, i) => {
        if (hl.sorted && hl.sorted.includes(i)) return '#4ade80';
        if (hl.swapping && hl.swapping.includes(i)) return '#f87171';
        if (hl.comparing && hl.comparing.includes(i)) return '#fbbf24';
        if (hl.pivot === i) return '#a78bfa';
        if (hl.active && hl.active.includes(i)) return '#60a5fa';
        return '#6366f1';
      });

    bars.exit().remove();
  }
</script>

<div class="viz-container" bind:this={container}></div>

<style>
  .viz-container {
    background: #1e1b4b;
    border-radius: 12px;
    padding: 8px;
    display: flex;
    justify-content: center;
  }

  .viz-container :global(rect) {
    transition: fill 0.1s ease;
  }
</style>
