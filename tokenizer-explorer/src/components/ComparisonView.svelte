<script>
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import { comparisonConfig, comparisonResults, TOKENIZER_TYPES, SAMPLE_CORPORA, SAMPLE_TESTS, TOKEN_COLORS } from '../stores/index.js';
  import { formatToken, compressionRatio } from '../lib/utils.js';

  let barChartContainer;
  let results = [];

  $: corpus = SAMPLE_CORPORA[$comparisonConfig.corpus]?.text || '';
  $: testText = $comparisonConfig.testText === 'custom' 
    ? $comparisonConfig.customTestText 
    : SAMPLE_TESTS[$comparisonConfig.testText] || '';

  function runComparison() {
    results = [];

    for (const algoKey of $comparisonConfig.algorithms) {
      const info = TOKENIZER_TYPES[algoKey];
      if (!info) continue;

      const tokenizer = new info.class();
      
      // Train
      if (algoKey === 'unigram') {
        tokenizer.train(corpus, 100, 0.2);
      } else if (algoKey === 'char' || algoKey === 'whitespace') {
        tokenizer.train(corpus);
      } else {
        tokenizer.train(corpus, $comparisonConfig.numMerges);
      }

      // Tokenize test text
      const tokens = tokenizer.tokenize(testText);

      results.push({
        algorithm: algoKey,
        name: info.name,
        tokens,
        tokenCount: tokens.length,
        vocabSize: tokenizer.getVocabSize(),
        compression: compressionRatio(testText, tokens),
        avgTokenLen: testText.length / tokens.length,
      });
    }

    results = results;
  }

  afterUpdate(() => {
    if (barChartContainer && results.length > 0) drawBarChart();
  });

  function drawBarChart() {
    d3.select(barChartContainer).selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = barChartContainer.clientWidth - margin.left - margin.right;
    const height = 220 - margin.top - margin.bottom;

    const svg = d3.select(barChartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grouped bar chart: token count, vocab size (normalized)
    const metrics = ['tokenCount', 'compression'];
    const metricLabels = { tokenCount: 'Token Count', compression: 'Compression Ratio' };

    const x0 = d3.scaleBand()
      .domain(results.map(r => r.algorithm))
      .range([0, width])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(metrics)
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(results, r => Math.max(r.tokenCount, r.compression * 10)) * 1.2])
      .range([height, 0]);

    const colors = { tokenCount: '#667eea', compression: '#764ba2' };

    // Draw groups
    const groups = svg.selectAll('.group')
      .data(results)
      .enter().append('g')
      .attr('transform', d => `translate(${x0(d.algorithm)},0)`);

    // Token count bars
    groups.append('rect')
      .attr('x', x1('tokenCount'))
      .attr('y', d => y(d.tokenCount))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - y(d.tokenCount))
      .attr('fill', colors.tokenCount)
      .attr('rx', 3);

    // Compression bars (scaled ×10 for visibility)
    groups.append('rect')
      .attr('x', x1('compression'))
      .attr('y', d => y(d.compression * 10))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - y(d.compression * 10))
      .attr('fill', colors.compression)
      .attr('rx', 3);

    // Value labels
    groups.append('text')
      .attr('x', x1('tokenCount') + x1.bandwidth() / 2)
      .attr('y', d => y(d.tokenCount) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e7e9ea')
      .attr('font-size', '10px')
      .text(d => d.tokenCount);

    groups.append('text')
      .attr('x', x1('compression') + x1.bandwidth() / 2)
      .attr('y', d => y(d.compression * 10) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e7e9ea')
      .attr('font-size', '10px')
      .text(d => d.compression.toFixed(1) + '×');

    // X-axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickFormat(d => TOKENIZER_TYPES[d]?.name.split(' ')[0] || d))
      .selectAll('text')
      .attr('fill', '#8899a6')
      .attr('font-size', '10px')
      .attr('transform', 'rotate(-15)')
      .attr('text-anchor', 'end');

    svg.selectAll('.domain, .tick line').attr('stroke', '#2d3d50');

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${width - 180}, -20)`);
    legend.append('rect').attr('width', 12).attr('height', 12).attr('fill', colors.tokenCount).attr('rx', 2);
    legend.append('text').attr('x', 16).attr('y', 10).attr('fill', '#8899a6').attr('font-size', '10px').text('Token Count');
    legend.append('rect').attr('x', 100).attr('width', 12).attr('height', 12).attr('fill', colors.compression).attr('rx', 2);
    legend.append('text').attr('x', 116).attr('y', 10).attr('fill', '#8899a6').attr('font-size', '10px').text('Compression');
  }

  let selectedAlgorithms = ['bpe', 'wordpiece', 'unigram'];
  
  function toggleAlgorithm(key) {
    const idx = $comparisonConfig.algorithms.indexOf(key);
    if (idx >= 0) {
      $comparisonConfig.algorithms = $comparisonConfig.algorithms.filter(a => a !== key);
    } else {
      $comparisonConfig.algorithms = [...$comparisonConfig.algorithms, key];
    }
  }
</script>

<div class="comparison-view">
  <div class="controls">
    <h2>📊 Algorithm Comparison</h2>
    <p class="desc">Train multiple tokenizers on the same corpus and compare their output on test text.</p>

    <div class="control-row">
      <div class="control-group">
        <label>Algorithms to Compare:</label>
        <div class="algo-toggles">
          {#each Object.entries(TOKENIZER_TYPES) as [key, info]}
            <label class="toggle-label">
              <input 
                type="checkbox" 
                checked={$comparisonConfig.algorithms.includes(key)}
                on:change={() => toggleAlgorithm(key)}
              />
              <span>{info.name.split('(')[0].trim()}</span>
            </label>
          {/each}
        </div>
      </div>

      <div class="control-group">
        <label>Training Corpus:</label>
        <select bind:value={$comparisonConfig.corpus}>
          {#each Object.entries(SAMPLE_CORPORA) as [key, info]}
            <option value={key}>{info.name}</option>
          {/each}
        </select>
      </div>

      <div class="control-group">
        <label>Test Text:</label>
        <select bind:value={$comparisonConfig.testText}>
          {#each Object.entries(SAMPLE_TESTS) as [key, text]}
            <option value={key}>{key}</option>
          {/each}
          <option value="custom">Custom...</option>
        </select>
      </div>

      <div class="control-group">
        <label>Merges: {$comparisonConfig.numMerges}</label>
        <input type="range" min="10" max="80" bind:value={$comparisonConfig.numMerges} />
      </div>
    </div>

    {#if $comparisonConfig.testText === 'custom'}
      <textarea bind:value={$comparisonConfig.customTestText} placeholder="Enter custom test text..." rows="2"></textarea>
    {/if}

    <div class="test-text-preview">
      <strong>Test:</strong> {testText}
    </div>

    <button class="run-btn" on:click={runComparison}>
      🔄 Run Comparison
    </button>
  </div>

  {#if results.length > 0}
    <div class="chart-section" bind:this={barChartContainer}></div>

    <div class="results-grid">
      {#each results as result, i}
        <div class="result-card">
          <div class="card-header" style="border-color: {TOKEN_COLORS[i]}">
            <h4>{result.name}</h4>
            <div class="card-stats">
              <span>{result.tokenCount} tokens</span>
              <span>Vocab: {result.vocabSize}</span>
              <span>{result.compression.toFixed(2)}× compression</span>
            </div>
          </div>
          <div class="card-tokens">
            {#each result.tokens as token, j}
              <span 
                class="token-chip"
                style="background: {TOKEN_COLORS[(i * 5 + j) % TOKEN_COLORS.length]}20; border-color: {TOKEN_COLORS[(i * 5 + j) % TOKEN_COLORS.length]}"
              >
                {formatToken(token)}
              </span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .comparison-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  h2 {
    font-size: 1.3rem;
    margin-bottom: 0.3rem;
  }

  .desc {
    color: #8899a6;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .control-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .control-group label {
    font-size: 0.85rem;
    color: #8899a6;
  }

  .control-group select,
  .control-group input[type="range"] {
    padding: 0.4rem;
    background: #253341;
    border: 1px solid #2d3d50;
    border-radius: 6px;
    color: #e7e9ea;
  }

  .algo-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: #e7e9ea;
    cursor: pointer;
  }

  textarea {
    width: 100%;
    padding: 0.5rem;
    background: #253341;
    border: 1px solid #2d3d50;
    border-radius: 6px;
    color: #e7e9ea;
    font-family: monospace;
    margin-bottom: 0.75rem;
  }

  .test-text-preview {
    padding: 0.5rem 0.75rem;
    background: #253341;
    border-radius: 6px;
    font-family: monospace;
    font-size: 0.85rem;
    color: #8899a6;
    margin-bottom: 1rem;
  }

  .run-btn {
    padding: 0.6rem 1.5rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
  }

  .run-btn:hover {
    opacity: 0.9;
  }

  .chart-section {
    min-height: 220px;
    background: #253341;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid #2d3d50;
  }

  .results-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .result-card {
    background: #253341;
    border-radius: 10px;
    padding: 1rem;
    border: 1px solid #2d3d50;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid;
  }

  .card-header h4 {
    font-size: 0.95rem;
  }

  .card-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: #8899a6;
  }

  .card-tokens {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }

  .token-chip {
    padding: 0.2rem 0.4rem;
    border: 1px solid;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.8rem;
    color: #e7e9ea;
  }
</style>
