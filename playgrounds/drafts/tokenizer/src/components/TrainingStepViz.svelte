<script>
  import { TOKEN_COLORS } from '../stores/index.js';

  export let step;
  export let algorithm;

  $: mergeInfo = step?.merge;
  $: sequences = step?.sequences || [];
  $: vocabSize = step?.vocabSize || 0;
  $: isInit = step?.type === 'init';
  $: isPrune = step?.type === 'prune';
</script>

<div class="step-viz">
  <div class="step-header">
    {#if isInit}
      <div class="step-badge init">Initialization</div>
      <span class="step-desc">
        {#if algorithm === 'unigram'}
          Built initial vocabulary from all substrings
        {:else}
          Split corpus into {algorithm === 'wordpiece' ? 'characters with ## prefix' : 'individual characters'}
        {/if}
      </span>
    {:else if isPrune}
      <div class="step-badge prune">Prune Step {step.step}</div>
      <span class="step-desc">
        Removed {step.numRemoved} tokens with lowest contribution to corpus likelihood
      </span>
    {:else if mergeInfo}
      <div class="step-badge merge">Merge Step {step.step}</div>
      <span class="step-desc">
        Merged <span class="token-highlight">{mergeInfo.a}</span> + <span class="token-highlight">{mergeInfo.b}</span>
        → <span class="token-highlight merged">{mergeInfo.result}</span>
        {#if mergeInfo.freq}
          <span class="freq-badge">freq: {mergeInfo.freq}</span>
        {/if}
        {#if mergeInfo.score}
          <span class="freq-badge">score: {mergeInfo.score.toFixed(4)}</span>
        {/if}
      </span>
    {/if}
    <div class="vocab-size">Vocab Size: <strong>{vocabSize}</strong></div>
  </div>

  {#if isPrune && step.removedSample}
    <div class="removed-tokens">
      <span class="label">Removed:</span>
      {#each step.removedSample as token, i}
        <span class="removed-token">{token}</span>
      {/each}
      {#if step.numRemoved > step.removedSample.length}
        <span class="more">+{step.numRemoved - step.removedSample.length} more</span>
      {/if}
    </div>
  {/if}

  {#if isPrune && step.topTokens}
    <div class="top-tokens">
      <h4>Top Tokens by Probability:</h4>
      <div class="token-list">
        {#each step.topTokens as { token, prob }, i}
          <span class="top-token" style="background: {TOKEN_COLORS[i % TOKEN_COLORS.length]}20; border-color: {TOKEN_COLORS[i % TOKEN_COLORS.length]}">
            {token} <span class="prob">{(prob * 100).toFixed(1)}%</span>
          </span>
        {/each}
      </div>
    </div>
  {/if}

  {#if sequences.length > 0 && !isPrune}
    <div class="sequences">
      <h4>Current Tokenization of Corpus Words:</h4>
      <div class="sequence-list">
        {#each sequences.slice(0, 15) as [seq, count], i}
          <div class="sequence-row">
            <span class="count">×{count}</span>
            <div class="tokens">
              {#each seq.split(' ') as token, j}
                <span 
                  class="token" 
                  style="background: {TOKEN_COLORS[j % TOKEN_COLORS.length]}30; border-color: {TOKEN_COLORS[j % TOKEN_COLORS.length]}"
                  class:highlight={mergeInfo && token === mergeInfo.result}
                >
                  {token}
                </span>
              {/each}
            </div>
          </div>
        {/each}
        {#if sequences.length > 15}
          <div class="more-indicator">... and {sequences.length - 15} more words</div>
        {/if}
      </div>
    </div>
  {/if}

  {#if step?.corpusLogLikelihood !== undefined}
    <div class="likelihood">
      Corpus Log-Likelihood: <strong>{step.corpusLogLikelihood.toFixed(2)}</strong>
    </div>
  {/if}
</div>

<style>
  .step-viz {
    background: #253341;
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid #2d3d50;
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .step-badge {
    padding: 0.3rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .step-badge.init {
    background: #1a4d2e;
    color: #4ade80;
  }

  .step-badge.merge {
    background: #1a2d4d;
    color: #667eea;
  }

  .step-badge.prune {
    background: #4d1a1a;
    color: #f87171;
  }

  .step-desc {
    font-size: 0.9rem;
    color: #8899a6;
  }

  .token-highlight {
    padding: 0.15rem 0.4rem;
    background: #667eea20;
    border: 1px solid #667eea;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.85rem;
    color: #e7e9ea;
  }

  .token-highlight.merged {
    background: #764ba220;
    border-color: #764ba2;
    color: #d4a5f5;
  }

  .freq-badge {
    padding: 0.15rem 0.5rem;
    background: #192734;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #667eea;
  }

  .vocab-size {
    margin-left: auto;
    font-size: 0.85rem;
    color: #8899a6;
  }

  .removed-tokens {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background: #192734;
    border-radius: 8px;
  }

  .removed-tokens .label {
    font-size: 0.8rem;
    color: #f87171;
    margin-right: 0.3rem;
  }

  .removed-token {
    padding: 0.15rem 0.4rem;
    background: #4d1a1a30;
    border: 1px solid #f8717150;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.75rem;
    color: #f87171;
    text-decoration: line-through;
  }

  .more {
    font-size: 0.75rem;
    color: #657786;
  }

  .top-tokens h4 {
    font-size: 0.85rem;
    color: #8899a6;
    margin-bottom: 0.5rem;
  }

  .token-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .top-token {
    padding: 0.2rem 0.5rem;
    border: 1px solid;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.8rem;
  }

  .top-token .prob {
    font-size: 0.7rem;
    opacity: 0.7;
  }

  .sequences h4 {
    font-size: 0.85rem;
    color: #8899a6;
    margin-bottom: 0.5rem;
  }

  .sequence-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .sequence-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .count {
    font-size: 0.75rem;
    color: #657786;
    min-width: 30px;
    text-align: right;
  }

  .tokens {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }

  .token {
    padding: 0.15rem 0.35rem;
    border: 1px solid;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.8rem;
    transition: all 0.3s;
  }

  .token.highlight {
    animation: pulse 0.5s ease-out;
    box-shadow: 0 0 8px rgba(118, 75, 162, 0.5);
  }

  @keyframes pulse {
    0% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  .more-indicator {
    font-size: 0.8rem;
    color: #657786;
    text-align: center;
    padding: 0.3rem;
  }

  .likelihood {
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: #192734;
    border-radius: 6px;
    font-size: 0.85rem;
    color: #8899a6;
    text-align: center;
  }
</style>
