<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { PolicyState, TokenDistribution } from '$lib/rlhf';
  import { entropy } from '$lib/rlhf';

  let {
    policy,
    positions = 6,
    vocab
  }: {
    policy: PolicyState;
    positions?: number;
    vocab: string[];
  } = $props();

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  const width = 320;
  const height = 100;
  const margin = { top: 12, right: 12, bottom: 20, left: 12 };
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
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const posWidth = innerWidth / positions;
    const maxEntropy = Math.log2(vocab.length); // Max possible entropy

    for (let pos = 0; pos < Math.min(positions, policy.distributions.length); pos++) {
      const dist = policy.distributions[pos];
      const e = entropy(dist);
      const normalizedEntropy = e / maxEntropy; // 0 = peaked, 1 = uniform
      
      // Color: high entropy = blue (exploring), low = red (exploiting)
      const color = d3.interpolateRdYlBu(normalizedEntropy);
      
      const x = pos * posWidth;
      
      // Background bar showing entropy level
      g.append('rect')
        .attr('x', x + 2)
        .attr('y', 0)
        .attr('width', posWidth - 4)
        .attr('height', innerHeight)
        .attr('rx', 4)
        .attr('fill', '#f3f4f6');

      // Entropy fill
      g.append('rect')
        .attr('x', x + 2)
        .attr('y', innerHeight * (1 - normalizedEntropy))
        .attr('width', posWidth - 4)
        .attr('height', innerHeight * normalizedEntropy)
        .attr('rx', 4)
        .attr('fill', color)
        .attr('opacity', 0.7);

      // Position label
      g.append('text')
        .attr('x', x + posWidth / 2)
        .attr('y', innerHeight + 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .attr('fill', '#9ca3af')
        .text(`pos ${pos + 1}`);

      // Entropy value
      g.append('text')
        .attr('x', x + posWidth / 2)
        .attr('y', innerHeight * (1 - normalizedEntropy) - 3)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', '#374151')
        .text(e.toFixed(1));
    }

    // Legend
    g.append('text')
      .attr('x', 0)
      .attr('y', -3)
      .attr('font-size', '8px')
      .attr('fill', '#3b82f6')
      .text('↑ Exploring');

    g.append('text')
      .attr('x', innerWidth)
      .attr('y', -3)
      .attr('text-anchor', 'end')
      .attr('font-size', '8px')
      .attr('fill', '#ef4444')
      .text('↓ Exploiting');
  }
</script>

<div class="rounded-lg border border-gray-100 bg-white p-3">
  <div class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
    Entropy / Exploration per Position
  </div>
  <div bind:this={container}></div>
</div>
