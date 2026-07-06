<script>
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import { TOKEN_COLORS } from '../stores/index.js';

  export let pairs = [];
  export let algorithm = 'bpe';

  let container;

  afterUpdate(() => {
    if (container && pairs.length > 0) draw();
  });

  function draw() {
    d3.select(container).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 60, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const displayPairs = pairs.slice(0, 8);
    const valueKey = algorithm === 'wordpiece' ? 'score' : 'freq';

    const x = d3.scaleBand()
      .domain(displayPairs.map((p, i) => i))
      .range([0, width])
      .padding(0.2);

    const maxVal = d3.max(displayPairs, d => d[valueKey] || d.freq || 0);
    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([height, 0]);

    // Bars
    svg.selectAll('.bar')
      .data(displayPairs)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', (d, i) => x(i))
      .attr('y', d => y(d[valueKey] || d.freq || 0))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d[valueKey] || d.freq || 0))
      .attr('fill', (d, i) => i === 0 ? '#764ba2' : TOKEN_COLORS[i % TOKEN_COLORS.length])
      .attr('rx', 3)
      .attr('opacity', (d, i) => i === 0 ? 1 : 0.7);

    // Labels on bars
    svg.selectAll('.bar-label')
      .data(displayPairs)
      .enter().append('text')
      .attr('x', (d, i) => x(i) + x.bandwidth() / 2)
      .attr('y', d => y(d[valueKey] || d.freq || 0) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e7e9ea')
      .attr('font-size', '10px')
      .text(d => {
        const val = d[valueKey] || d.freq;
        return typeof val === 'number' && val < 1 ? val.toFixed(3) : val;
      });

    // X-axis labels (pair names)
    svg.selectAll('.pair-label')
      .data(displayPairs)
      .enter().append('text')
      .attr('x', (d, i) => x(i) + x.bandwidth() / 2)
      .attr('y', height + 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8899a6')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text(d => {
        const pair = d.pair || [d.a, d.b];
        return `${pair[0]}+${pair[1]}`;
      })
      .each(function() {
        const text = d3.select(this);
        if (text.node().getComputedTextLength() > x.bandwidth()) {
          text.attr('font-size', '7px');
        }
      });

    // Y-axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .selectAll('text,line,path')
      .attr('fill', '#8899a6').attr('stroke', '#8899a6');

    // Y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8899a6')
      .attr('font-size', '11px')
      .text(algorithm === 'wordpiece' ? 'Score' : 'Frequency');
  }
</script>

<div class="chart-container">
  <h4>📊 Top Candidate Pairs</h4>
  <div class="chart" bind:this={container}></div>
</div>

<style>
  .chart-container {
    background: #253341;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid #2d3d50;
  }

  h4 {
    font-size: 0.9rem;
    color: #8899a6;
    margin-bottom: 0.5rem;
  }

  .chart {
    width: 100%;
    min-height: 200px;
  }
</style>
