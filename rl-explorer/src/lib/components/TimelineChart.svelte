<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { TrainingStep } from '$lib/rlhf';

  let { 
    history, 
    color = '#6366F1',
    algorithm = 'PPO'
  }: {
    history: TrainingStep[];
    color?: string;
    algorithm?: string;
  } = $props();

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  const margin = { top: 16, right: 16, bottom: 24, left: 40 };
  const width = 340;
  const height = 140;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

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

  function update() {
    svg.selectAll('*').remove();

    if (history.length === 0) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#9ca3af')
        .text('No training steps yet');
      return;
    }

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xDomain = [1, Math.max(history.length, 5)];
    const xScale = d3.scaleLinear().domain(xDomain).range([0, innerWidth]);
    
    // Three lines: reward, entropy, KL
    const rewardExtent = d3.extent(history, d => d.avgReward) as [number, number];
    const entropyExtent = d3.extent(history, d => d.entropy) as [number, number];
    const klExtent = d3.extent(history, d => d.klDivergence) as [number, number];

    const yReward = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(Math.min(history.length, 8)).tickFormat(d3.format('d')))
      .selectAll('text').attr('font-size', '8px');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yReward).ticks(4))
      .selectAll('text').attr('font-size', '8px');

    // Reward line
    const rewardLine = d3.line<TrainingStep>()
      .x(d => xScale(d.stepNumber))
      .y(d => yReward(d.avgReward))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(history)
      .attr('d', rewardLine)
      .attr('fill', 'none')
      .attr('stroke', '#10B981')
      .attr('stroke-width', 2);

    // KL line (scaled to 0-1 range)
    const maxKL = Math.max(...history.map(h => h.klDivergence), 0.5);
    const klLine = d3.line<TrainingStep>()
      .x(d => xScale(d.stepNumber))
      .y(d => yReward(Math.min(d.klDivergence / maxKL, 1)))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(history)
      .attr('d', klLine)
      .attr('fill', 'none')
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2');

    // Entropy line (scaled to 0-1 range)  
    const maxEntropy = Math.max(...history.map(h => h.entropy), 2);
    const entropyLine = d3.line<TrainingStep>()
      .x(d => xScale(d.stepNumber))
      .y(d => yReward(d.entropy / maxEntropy))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(history)
      .attr('d', entropyLine)
      .attr('fill', 'none')
      .attr('stroke', '#6366F1')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '2,2');

    // Dots on reward line
    g.selectAll('.reward-dot')
      .data(history)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.stepNumber))
      .attr('cy', d => yReward(d.avgReward))
      .attr('r', 3)
      .attr('fill', '#10B981');

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerWidth - 90}, -8)`);
    
    [
      { label: 'Reward', color: '#10B981', dash: '' },
      { label: 'KL', color: '#EF4444', dash: '4,2' },
      { label: 'Entropy', color: '#6366F1', dash: '2,2' }
    ].forEach((item, i) => {
      legend.append('line')
        .attr('x1', 0).attr('x2', 14)
        .attr('y1', i * 12).attr('y2', i * 12)
        .attr('stroke', item.color)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', item.dash);
      legend.append('text')
        .attr('x', 18).attr('y', i * 12 + 3)
        .attr('font-size', '8px')
        .attr('fill', '#6b7280')
        .text(item.label);
    });
  }
</script>

<div class="rounded-lg border border-gray-100 bg-white p-3">
  <div class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
    {algorithm} Training Progress
  </div>
  <div bind:this={container}></div>
</div>
