<script>
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';

  export let steps = [];
  export let currentStep = 0;

  let container;

  $: vocabData = steps.map((s, i) => ({
    step: i,
    vocabSize: s.vocabSize || 0,
    type: s.type,
  }));

  afterUpdate(() => {
    if (container && vocabData.length > 0) draw();
  });

  function draw() {
    d3.select(container).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, vocabData.length - 1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(vocabData, d => d.vocabSize) * 1.1])
      .range([height, 0]);

    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(y.ticks(5))
      .enter().append('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', '#2d3d50')
      .attr('stroke-dasharray', '2,2');

    // Line
    const line = d3.line()
      .x((d, i) => x(i))
      .y(d => y(d.vocabSize))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(vocabData)
      .attr('fill', 'none')
      .attr('stroke', '#667eea')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Area under curve
    const area = d3.area()
      .x((d, i) => x(i))
      .y0(height)
      .y1(d => y(d.vocabSize))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(vocabData)
      .attr('fill', 'url(#vocabGradient)')
      .attr('d', area);

    // Gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'vocabGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#667eea').attr('stop-opacity', 0.3);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#667eea').attr('stop-opacity', 0.0);

    // Current step indicator
    if (currentStep < vocabData.length) {
      const cx = x(currentStep);
      const cy = y(vocabData[currentStep].vocabSize);

      svg.append('line')
        .attr('x1', cx).attr('x2', cx)
        .attr('y1', 0).attr('y2', height)
        .attr('stroke', '#764ba2')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');

      svg.append('circle')
        .attr('cx', cx).attr('cy', cy)
        .attr('r', 5)
        .attr('fill', '#764ba2')
        .attr('stroke', '#e7e9ea')
        .attr('stroke-width', 2);
    }

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(Math.min(vocabData.length, 10)).tickFormat(d => `${d}`))
      .selectAll('text,line,path')
      .attr('fill', '#8899a6').attr('stroke', '#8899a6');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text,line,path')
      .attr('fill', '#8899a6').attr('stroke', '#8899a6');

    // Labels
    svg.append('text')
      .attr('x', width / 2).attr('y', height + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8899a6')
      .attr('font-size', '11px')
      .text('Training Step');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2).attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8899a6')
      .attr('font-size', '11px')
      .text('Vocab Size');
  }
</script>

<div class="chart-container">
  <h4>📈 Vocabulary Growth</h4>
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
