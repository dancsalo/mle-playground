<script>
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import { corpusInfluenceConfig, TOKENIZER_TYPES, SAMPLE_CORPORA, TOKEN_COLORS } from '../stores/index.js';
  import { formatToken } from '../lib/utils.js';

  let results = [];
  let chartContainer;

  function runAnalysis() {
    results = [];
    const algoKey = $corpusInfluenceConfig.algorithm;
    const TokenizerClass = TOKENIZER_TYPES[algoKey].class;

    for (const corpusKey of $corpusInfluenceConfig.corpora) {
      const corpusInfo = SAMPLE_CORPORA[corpusKey];
      if (!corpusInfo) continue;

      const tokenizer = new TokenizerClass();

      if (algoKey === 'unigram') {
        tokenizer.train(corpusInfo.text, 100, 0.2);
      } else if (algoKey === 'char' || algoKey === 'whitespace') {
        tokenizer.train(corpusInfo.text);
      } else {
        tokenizer.train(corpusInfo.text, $corpusInfluenceConfig.numMerges || 40);
      }

      const tokens = tokenizer.tokenize($corpusInfluenceConfig.testText);
      const vocabSize = tokenizer.getVocabSize();
      
      // Get the merge history (top merges) for BPE/WordPiece
      const merges = tokenizer.getMerges ? tokenizer.getMerges().slice(0, 15) : [];

      results.push({
        corpus: corpusKey,
        corpusName: corpusInfo.name,
        tokens,
        tokenCount: tokens.length,
        vocabSize,
        merges,
      });
    }

    results = results;
  }

  afterUpdate(() => {
    if (chartContainer && results.length > 0) drawChart();
  });

  function drawChart() {
    d3.select(chartContainer).selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 80, left: 60 };
    const width = chartContainer.clientWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(results.map(r => r.corpusName))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(results, r => r.tokenCount) * 1.3])
      .range([height, 0]);

    // Bars
    svg.selectAll('.bar')
      .data(results)
      .enter().append('rect')
      .attr('x', d => x(d.corpusName))
      .attr('y', d => y(d.tokenCount))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.tokenCount))
      .attr('fill', (d, i) => TOKEN_COLORS[i])
      .attr('rx', 4)
      .attr('opacity', 0.85);

    // Value labels
    svg.selectAll('.val-label')
      .data(results)
      .enter().append('text')
      .attr('x', d => x(d.corpusName) + x.bandwidth() / 2)
      .attr('y', d => y(d.tokenCount) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e7e9ea')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(d => d.tokenCount + ' tokens');

    // X-axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', '#8899a6')
      .attr('font-size', '11px');

    svg.selectAll('.domain, .tick line').attr('stroke', '#2d3d50');

    // Y-axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text, line, path')
      .attr('fill', '#8899a6').attr('stroke', '#8899a6');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e7e9ea')
      .attr('font-size', '13px')
      .text(`Token Count by Training Corpus (same test text)`);
  }
</script>

<div class="corpus-view">
  <div class="header">
    <h2>📚 Corpus Influence on Tokenization</h2>
    <p class="desc">
      See how training on different corpora changes the tokenizer's behavior.
      The same text produces different token counts and splits depending on training data.
    </p>
  </div>

  <div class="controls">
    <div class="control-row">
      <div class="control-group">
        <label>Algorithm:</label>
        <select bind:value={$corpusInfluenceConfig.algorithm}>
          {#each Object.entries(TOKENIZER_TYPES) as [key, info]}
            <option value={key}>{info.name}</option>
          {/each}
        </select>
      </div>

      <div class="control-group">
        <label>Training Corpora to Compare:</label>
        <div class="corpus-toggles">
          {#each Object.entries(SAMPLE_CORPORA) as [key, info]}
            <label class="toggle-label">
              <input 
                type="checkbox" 
                checked={$corpusInfluenceConfig.corpora.includes(key)}
                on:change={() => {
                  const idx = $corpusInfluenceConfig.corpora.indexOf(key);
                  if (idx >= 0) {
                    $corpusInfluenceConfig.corpora = $corpusInfluenceConfig.corpora.filter(c => c !== key);
                  } else {
                    $corpusInfluenceConfig.corpora = [...$corpusInfluenceConfig.corpora, key];
                  }
                }}
              />
              <span>{info.name}</span>
            </label>
          {/each}
        </div>
      </div>

      <div class="control-group">
        <label>Merges: {$corpusInfluenceConfig.numMerges || 40}</label>
        <input type="range" min="10" max="80" bind:value={$corpusInfluenceConfig.numMerges} />
      </div>
    </div>

    <div class="control-group full-width">
      <label>Test Text (tokenized by each corpus-trained tokenizer):</label>
      <textarea 
        bind:value={$corpusInfluenceConfig.testText}
        rows="2"
        placeholder="Enter text to test..."
      ></textarea>
    </div>

    <button class="run-btn" on:click={runAnalysis}>
      🔬 Analyze Corpus Influence
    </button>
  </div>

  {#if results.length > 0}
    <div class="chart-section" bind:this={chartContainer}></div>

    <div class="results-detail">
      <h3>Detailed Token Comparison</h3>
      <div class="comparison-grid">
        {#each results as result, i}
          <div class="corpus-result">
            <div class="result-header" style="border-left: 3px solid {TOKEN_COLORS[i]}">
              <strong>{result.corpusName}</strong>
              <span class="token-count">{result.tokenCount} tokens</span>
              <span class="vocab-info">Vocab: {result.vocabSize}</span>
            </div>
            <div class="result-tokens">
              {#each result.tokens as token, j}
                <span 
                  class="token-chip"
                  style="background: {TOKEN_COLORS[i]}20; border-color: {TOKEN_COLORS[i]}"
                >
                  {formatToken(token)}
                </span>
              {/each}
            </div>
            {#if result.merges.length > 0}
              <div class="merge-history">
                <span class="merge-label">Top merges learned:</span>
                {#each result.merges.slice(0, 8) as [a, b], j}
                  <span class="merge-chip">{a}+{b}→{a}{b}</span>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <div class="insight-box">
      <h4>💡 Key Insight</h4>
      <p>
        {#if results.length >= 2}
          Training on <strong>{results[0].corpusName}</strong> produces {results[0].tokenCount} tokens,
          while <strong>{results[results.length-1].corpusName}</strong> produces {results[results.length-1].tokenCount} tokens
          for the same input text.
          {#if results[0].tokenCount !== results[results.length-1].tokenCount}
            This {Math.abs(results[0].tokenCount - results[results.length-1].tokenCount)}-token difference
            shows how the training corpus directly influences tokenization efficiency.
          {/if}
          Tokenizers are most efficient on text similar to their training data.
        {/if}
      </p>
    </div>
  {/if}
</div>

<style>
  .corpus-view {
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
  }

  .controls {
    background: #253341;
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid #2d3d50;
  }

  .control-row {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .control-group.full-width {
    margin-bottom: 1rem;
  }

  .control-group label {
    font-size: 0.85rem;
    color: #8899a6;
  }

  .control-group select,
  .control-group input[type="range"],
  textarea {
    padding: 0.5rem;
    background: #192734;
    border: 1px solid #2d3d50;
    border-radius: 6px;
    color: #e7e9ea;
    width: 100%;
  }

  textarea {
    font-family: monospace;
    resize: vertical;
  }

  .corpus-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: #e7e9ea;
    cursor: pointer;
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

  .run-btn:hover { opacity: 0.9; }

  .chart-section {
    min-height: 250px;
    background: #253341;
    border-radius: 12px;
    padding: 1rem;
    border: 1px solid #2d3d50;
  }

  .results-detail h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: #8899a6;
  }

  .comparison-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .corpus-result {
    background: #253341;
    border-radius: 10px;
    padding: 1rem;
    border: 1px solid #2d3d50;
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
    padding-left: 0.75rem;
  }

  .token-count {
    font-size: 0.85rem;
    color: #667eea;
    font-weight: 600;
  }

  .vocab-info {
    font-size: 0.8rem;
    color: #657786;
  }

  .result-tokens {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-bottom: 0.5rem;
  }

  .token-chip {
    padding: 0.2rem 0.4rem;
    border: 1px solid;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.8rem;
    color: #e7e9ea;
  }

  .merge-history {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem;
    padding-top: 0.5rem;
    border-top: 1px dashed #2d3d50;
  }

  .merge-label {
    font-size: 0.75rem;
    color: #657786;
  }

  .merge-chip {
    padding: 0.1rem 0.3rem;
    background: #192734;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.7rem;
    color: #8899a6;
  }

  .insight-box {
    background: #1a2d4d;
    border: 1px solid #667eea50;
    border-radius: 10px;
    padding: 1rem 1.25rem;
  }

  .insight-box h4 {
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
    color: #667eea;
  }

  .insight-box p {
    font-size: 0.9rem;
    color: #8899a6;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    .control-row {
      grid-template-columns: 1fr;
    }
  }
</style>
