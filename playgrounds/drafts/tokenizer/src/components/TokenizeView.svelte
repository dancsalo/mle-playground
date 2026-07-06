<script>
  import { trainingState, SAMPLE_TESTS, TOKEN_COLORS } from '../stores/index.js';
  import { formatToken, compressionRatio } from '../lib/utils.js';

  let testText = SAMPLE_TESTS.simple;
  let customText = '';
  let selectedSample = 'simple';
  let tokens = [];
  let stepsDetail = [];

  $: tokenizer = $trainingState.tokenizer;
  $: hasTokenizer = tokenizer !== null;

  $: {
    if (selectedSample === 'custom') {
      testText = customText;
    } else {
      testText = SAMPLE_TESTS[selectedSample] || '';
    }
  }

  function doTokenize() {
    if (!tokenizer || !testText) return;
    tokens = tokenizer.tokenize(testText);
    if (tokenizer.tokenizeWithSteps) {
      stepsDetail = tokenizer.tokenizeWithSteps(testText);
    }
  }

  $: if (testText && tokenizer) {
    doTokenize();
  }

  function getTokenColor(token, index) {
    // Color by unique token identity
    const uniqueTokens = [...new Set(tokens)];
    const tokenIndex = uniqueTokens.indexOf(token);
    return TOKEN_COLORS[tokenIndex % TOKEN_COLORS.length];
  }
</script>

<div class="tokenize-view">
  {#if !hasTokenizer}
    <div class="no-tokenizer">
      <div class="icon">⚠️</div>
      <h3>No Tokenizer Trained</h3>
      <p>Go to the <strong>Training Visualization</strong> tab first to train a tokenizer, then come back here to see it in action.</p>
    </div>
  {:else}
    <div class="input-section">
      <h2>✂️ Tokenize Text</h2>
      <p class="desc">See how your trained tokenizer segments text into tokens.</p>

      <div class="sample-selector">
        <label>Sample texts:</label>
        <select bind:value={selectedSample}>
          {#each Object.entries(SAMPLE_TESTS) as [key, text]}
            <option value={key}>{key}: {text.slice(0, 40)}...</option>
          {/each}
          <option value="custom">Custom...</option>
        </select>
      </div>

      {#if selectedSample === 'custom'}
        <textarea 
          bind:value={customText}
          placeholder="Enter text to tokenize..."
          rows="3"
        ></textarea>
      {/if}

      <div class="input-display">
        <label>Input:</label>
        <div class="text-input">{testText}</div>
      </div>
    </div>

    <div class="results-section">
      <div class="stats-row">
        <div class="stat">
          <span class="stat-label">Characters</span>
          <span class="stat-value">{testText.length}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Tokens</span>
          <span class="stat-value">{tokens.length}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Compression</span>
          <span class="stat-value">{compressionRatio(testText, tokens).toFixed(2)}×</span>
        </div>
        <div class="stat">
          <span class="stat-label">Avg Token Length</span>
          <span class="stat-value">{tokens.length > 0 ? (testText.length / tokens.length).toFixed(1) : '—'}</span>
        </div>
      </div>

      <div class="token-output">
        <h3>Tokens ({tokens.length})</h3>
        <div class="token-chips">
          {#each tokens as token, i}
            <span 
              class="token-chip" 
              style="background: {getTokenColor(token, i)}20; border-color: {getTokenColor(token, i)}; color: {getTokenColor(token, i)}"
              title="Token {i}: '{token}'"
            >
              {formatToken(token)}
            </span>
          {/each}
        </div>
      </div>

      {#if stepsDetail.length > 0}
        <div class="steps-detail">
          <h3>Tokenization Process</h3>
          {#each stepsDetail as detail}
            <div class="word-detail">
              <span class="word-label">{detail.word}</span>
              {#if detail.steps}
                <div class="step-progression">
                  {#each detail.steps as step, i}
                    <div class="step-row">
                      <span class="step-num">{i === 0 ? 'Init' : `Merge ${i}`}</span>
                      <div class="step-tokens">
                        {#each step.tokens as t, j}
                          <span class="mini-token">{formatToken(t)}</span>
                        {/each}
                      </div>
                      {#if step.merge}
                        <span class="merge-info">({step.merge[0]} + {step.merge[1]})</span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="final-tokens">
                  {#each detail.finalTokens as t}
                    <span class="mini-token">{formatToken(t)}</span>
                  {/each}
                </div>
              {/if}

              {#if detail.alternatives && detail.alternatives.length > 1}
                <div class="alternatives">
                  <span class="alt-label">Alternatives:</span>
                  {#each detail.alternatives.slice(1) as alt}
                    <div class="alt-row">
                      {#each alt.tokens as t}
                        <span class="mini-token alt">{formatToken(t)}</span>
                      {/each}
                      <span class="alt-score">LL: {alt.logProb.toFixed(2)}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .tokenize-view {
    max-width: 900px;
    margin: 0 auto;
  }

  .no-tokenizer {
    text-align: center;
    padding: 3rem;
    color: #8899a6;
  }

  .no-tokenizer .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .no-tokenizer h3 {
    margin-bottom: 0.5rem;
    color: #e7e9ea;
  }

  .input-section {
    margin-bottom: 1.5rem;
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

  .sample-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .sample-selector label {
    font-size: 0.85rem;
    color: #8899a6;
  }

  .sample-selector select {
    flex: 1;
    padding: 0.5rem;
    background: #253341;
    border: 1px solid #2d3d50;
    border-radius: 6px;
    color: #e7e9ea;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    background: #253341;
    border: 1px solid #2d3d50;
    border-radius: 8px;
    color: #e7e9ea;
    font-family: monospace;
    resize: vertical;
    margin-bottom: 0.75rem;
  }

  .input-display {
    margin-top: 0.5rem;
  }

  .input-display label {
    font-size: 0.8rem;
    color: #8899a6;
  }

  .text-input {
    padding: 0.75rem;
    background: #253341;
    border: 1px solid #2d3d50;
    border-radius: 8px;
    font-family: monospace;
    font-size: 0.9rem;
    color: #e7e9ea;
  }

  .stats-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .stat {
    flex: 1;
    min-width: 120px;
    padding: 0.75rem;
    background: #253341;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #2d3d50;
  }

  .stat-label {
    display: block;
    font-size: 0.75rem;
    color: #8899a6;
    margin-bottom: 0.2rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #667eea;
  }

  .token-output {
    margin-bottom: 1.5rem;
  }

  .token-output h3 {
    font-size: 1rem;
    color: #8899a6;
    margin-bottom: 0.5rem;
  }

  .token-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .token-chip {
    padding: 0.3rem 0.6rem;
    border: 1px solid;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.85rem;
    cursor: default;
    transition: transform 0.1s;
  }

  .token-chip:hover {
    transform: scale(1.05);
  }

  .steps-detail {
    margin-top: 1.5rem;
  }

  .steps-detail h3 {
    font-size: 1rem;
    color: #8899a6;
    margin-bottom: 0.75rem;
  }

  .word-detail {
    padding: 0.75rem;
    background: #253341;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    border: 1px solid #2d3d50;
  }

  .word-label {
    font-size: 0.8rem;
    color: #667eea;
    font-family: monospace;
    display: block;
    margin-bottom: 0.5rem;
  }

  .step-progression {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .step-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .step-num {
    font-size: 0.7rem;
    color: #657786;
    min-width: 55px;
  }

  .step-tokens {
    display: flex;
    gap: 2px;
  }

  .mini-token {
    padding: 0.1rem 0.3rem;
    background: #667eea20;
    border: 1px solid #667eea50;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.75rem;
    color: #e7e9ea;
  }

  .mini-token.alt {
    background: #764ba220;
    border-color: #764ba250;
  }

  .merge-info {
    font-size: 0.7rem;
    color: #657786;
  }

  .final-tokens {
    display: flex;
    gap: 2px;
  }

  .alternatives {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px dashed #2d3d50;
  }

  .alt-label {
    font-size: 0.75rem;
    color: #657786;
    display: block;
    margin-bottom: 0.3rem;
  }

  .alt-row {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-bottom: 0.2rem;
  }

  .alt-score {
    font-size: 0.7rem;
    color: #657786;
    margin-left: 0.5rem;
  }
</style>
