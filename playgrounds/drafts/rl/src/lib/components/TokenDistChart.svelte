<script lang="ts">
  import type { TokenDistribution } from '$lib/rlhf';
  import { topK } from '$lib/rlhf';
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let { 
    oldDist, 
    newDist, 
    label = 'Token Distribution',
    color = '#6366F1',
    maxTokens = 8 
  }: {
    oldDist: TokenDistribution;
    newDist: TokenDistribution;
    label?: string;
    color?: string;
    maxTokens?: number;
  } = $props();

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  const margin = { top: 8, right: 12, bottom: 4, left: 75 };
  const width = 320;
  const barHeight = 22;
  
  let height = $derived((maxTokens * barHeight) + margin.top + margin.bottom + 10);
  let innerWidth = width - margin.left - margin.right;

  onMount(() => {
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    update();
  });

  $effect(() => {
    if (svg) {
      svg.attr('height', height);
      update();
    }
  });

  function update() {
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const oldTokens = topK(oldDist, maxTokens);
    const newTokens = topK(newDist, maxTokens);
    
    // Merge tokens for display
    const allTokens = new Map<string, { old: number; new: number }>();
    for (const t of oldTokens) {
      allTokens.set(t.token, { old: t.prob, new: 0 });
    }
    for (const t of newTokens) {
      const existing = allTokens.get(t.token);
      if (existing) {
        existing.new = t.prob;
      } else {
        allTokens.set(t.token, { old: 0, new: t.prob });
      }
    }
    
    // Sort by new probability
    const sorted = [...allTokens.entries()]
      .sort((a, b) => b[1].new - a[1].new)
      .slice(0, maxTokens);

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);

    sorted.forEach(([token, { old: oldP, new: newP }], i) => {
      const y = i * barHeight;
      const delta = newP - oldP;

      // Token label
      g.append('text')
        .attr('x', -4)
        .attr('y', y + barHeight / 2 + 1)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#374151')
        .text(token);

      // Old probability bar (ghost)
      g.append('rect')
        .attr('x', 0)
        .attr('y', y + 3)
        .attr('width', xScale(oldP))
        .attr('height', barHeight - 8)
        .attr('fill', color)
        .attr('opacity', 0.15)
        .attr('rx', 2);

      // New probability bar
      g.append('rect')
        .attr('x', 0)
        .attr('y', y + 3)
        .attr('width', xScale(newP))
        .attr('height', barHeight - 8)
        .attr('fill', color)
        .attr('opacity', 0.7)
        .attr('rx', 2);

      // Delta indicator
      if (Math.abs(delta) > 0.005) {
        const deltaColor = delta > 0 ? '#10B981' : '#EF4444';
        const deltaText = delta > 0 ? `+${(delta * 100).toFixed(1)}%` : `${(delta * 100).toFixed(1)}%`;
        
        g.append('text')
          .attr('x', xScale(Math.max(oldP, newP)) + 6)
          .attr('y', y + barHeight / 2 + 1)
          .attr('font-size', '9px')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('fill', deltaColor)
          .attr('font-weight', '600')
          .text(deltaText);
      }

      // Probability value
      g.append('text')
        .attr('x', Math.max(xScale(newP) - 4, 14))
        .attr('y', y + barHeight / 2 + 1)
        .attr('text-anchor', 'end')
        .attr('font-size', '8px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#fff')
        .attr('opacity', newP > 0.08 ? 1 : 0)
        .text((newP * 100).toFixed(1));
    });
  }
</script>

<div class="rounded-lg border border-gray-100 bg-white p-3">
  <div class="mb-1 text-xs font-semibold text-gray-500">{label}</div>
  <div bind:this={container}></div>
</div>
