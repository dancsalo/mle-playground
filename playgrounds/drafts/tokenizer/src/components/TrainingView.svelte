<script>
  import { trainingConfig, trainingState, TOKENIZER_TYPES, SAMPLE_CORPORA } from '../stores/index.js';
  import { delay } from '../lib/utils.js';
  import TrainingStepViz from './TrainingStepViz.svelte';
  import VocabGrowthChart from './VocabGrowthChart.svelte';
  import PairFrequencyChart from './PairFrequencyChart.svelte';

  let animationSpeed = 500; // ms per step
  let isPlaying = false;
  let playInterval = null;

  $: corpus = $trainingConfig.corpus === 'custom' 
    ? $trainingConfig.customCorpus 
    : SAMPLE_CORPORA[$trainingConfig.corpus]?.text || '';

  $: algorithmInfo = TOKENIZER_TYPES[$trainingConfig.algorithm];

  async function startTraining() {
    const TokenizerClass = TOKENIZER_TYPES[$trainingConfig.algorithm].class;
    const tokenizer = new TokenizerClass();

    $trainingState = {
      steps: [],
      currentStep: 0,
      isTraining: true,
      isComplete: false,
      tokenizer: null,
    };

    let steps;
    if ($trainingConfig.algorithm === 'unigram') {
      steps = tokenizer.train(corpus, $trainingConfig.targetVocabSize || 100, 0.2);
    } else if ($trainingConfig.algorithm === 'char' || $trainingConfig.algorithm === 'whitespace') {
      steps = tokenizer.train(corpus);
    } else {
      steps = tokenizer.train(corpus, $trainingConfig.numMerges);
    }

    $trainingState = {
      steps,
      currentStep: 0,
      isTraining: false,
      isComplete: true,
      tokenizer,
    };
  }

  function playAnimation() {
    if (isPlaying) {
      clearInterval(playInterval);
      isPlaying = false;
      return;
    }

    isPlaying = true;
    playInterval = setInterval(() => {
      if ($trainingState.currentStep >= $trainingState.steps.length - 1) {
        clearInterval(playInterval);
        isPlaying = false;
        return;
      }
      $trainingState.currentStep++;
      $trainingState = $trainingState;
    }, animationSpeed);
  }

  function stepForward() {
    if ($trainingState.currentStep < $trainingState.steps.length - 1) {
      $trainingState.currentStep++;
      $trainingState = $trainingState;
    }
  }

  function stepBack() {
    if ($trainingState.currentStep > 0) {
      $trainingState.currentStep--;
      $trainingState = $trainingState;
    }
  }

  function jumpToStep(i) {
    $trainingState.currentStep = i;
    $trainingState = $trainingState;
  }

  $: currentStepData = $trainingState.steps[$trainingState.currentStep] || null;

  function handleAlgorithmChange() {
    $trainingState = { steps: [], currentStep: 0, isTraining: false, isComplete: false, tokenizer: null };
  }
</script>

<div class="training-view">
  <div class="controls-panel">
    <h2>Training Configuration</h2>
    
    <div class="control-group">
      <label>Algorithm</label>
      <select bind:value={$trainingConfig.algorithm} on:change={handleAlgorithmChange}>
        {#each Object.entries(TOKENIZER_TYPES) as [key, info]}
          <option value={key}>{info.name}</option>
        {/each}
      </select>
      <span class="hint">{algorithmInfo?.description}</span>
    </div>

    <div class="control-group">
      <label>Training Corpus</label>
      <select bind:value={$trainingConfig.corpus}>
        {#each Object.entries(SAMPLE_CORPORA) as [key, info]}
          <option value={key}>{info.name}</option>
        {/each}
        <option value="custom">Custom...</option>
      </select>
    </div>

    {#if $trainingConfig.corpus === 'custom'}
      <div class="control-group">
        <label>Custom Corpus</label>
        <textarea 
          bind:value={$trainingConfig.customCorpus}
          placeholder="Enter your training text here..."
          rows="4"
        ></textarea>
      </div>
    {/if}

    <div class="corpus-preview">
      <label>Corpus Preview</label>
      <div class="preview-text">{corpus.slice(0, 200)}{corpus.length > 200 ? '...' : ''}</div>
    </div>

    {#if $trainingConfig.algorithm !== 'unigram' && $trainingConfig.algorithm !== 'char' && $trainingConfig.algorithm !== 'whitespace'}
      <div class="control-group">
        <label>Number of Merges: {$trainingConfig.numMerges}</label>
        <input type="range" min="5" max="100" bind:value={$trainingConfig.numMerges} />
      </div>
    {/if}

    {#if $trainingConfig.algorithm === 'unigram'}
      <div class="control-group">
        <label>Target Vocab Size: {$trainingConfig.targetVocabSize}</label>
        <input type="range" min="20" max="200" bind:value={$trainingConfig.targetVocabSize} />
      </div>
    {/if}

    <button class="train-btn" on:click={startTraining} disabled={$trainingState.isTraining || !corpus}>
      {$trainingState.isTraining ? '⏳ Training...' : '🚀 Train Tokenizer'}
    </button>

    {#if $trainingState.isComplete}
      <div class="algo-explanation">
        {#if $trainingConfig.algorithm === 'bpe'}
          <h4>How BPE Training Works:</h4>
          <ol>
            <li>Split text into characters</li>
            <li>Count all adjacent pairs</li>
            <li>Merge the most frequent pair</li>
            <li>Repeat until desired vocab size</li>
          </ol>
        {:else if $trainingConfig.algorithm === 'wordpiece'}
          <h4>How WordPiece Training Works:</h4>
          <ol>
            <li>Split text into characters (## prefix for non-initial)</li>
            <li>Score pairs: freq(ab) / (freq(a) × freq(b))</li>
            <li>Merge the highest-scoring pair</li>
            <li>Repeat until desired vocab size</li>
          </ol>
        {:else if $trainingConfig.algorithm === 'unigram'}
          <h4>How Unigram Training Works:</h4>
          <ol>
            <li>Start with a large vocabulary (all substrings)</li>
            <li>Compute each token's contribution to corpus likelihood</li>
            <li>Remove the least useful tokens</li>
            <li>Repeat until target vocab size</li>
          </ol>
        {/if}
      </div>
    {/if}
  </div>

  <div class="visualization-panel">
    {#if !$trainingState.isComplete}
      <div class="placeholder">
        <div class="placeholder-icon">🎯</div>
        <p>Configure settings and click <strong>Train Tokenizer</strong> to see the step-by-step visualization.</p>
      </div>
    {:else}
      <div class="playback-controls">
        <button on:click={stepBack} disabled={$trainingState.currentStep === 0}>⏮</button>
        <button on:click={playAnimation} class="play-btn">
          {isPlaying ? '⏸' : '▶️'}
        </button>
        <button on:click={stepForward} disabled={$trainingState.currentStep >= $trainingState.steps.length - 1}>⏭</button>
        
        <div class="step-slider">
          <input 
            type="range" 
            min="0" 
            max={$trainingState.steps.length - 1} 
            bind:value={$trainingState.currentStep}
          />
          <span class="step-label">
            Step {$trainingState.currentStep} / {$trainingState.steps.length - 1}
          </span>
        </div>

        <div class="speed-control">
          <label>Speed:</label>
          <select bind:value={animationSpeed}>
            <option value={1000}>Slow</option>
            <option value={500}>Normal</option>
            <option value={200}>Fast</option>
            <option value={50}>Very Fast</option>
          </select>
        </div>
      </div>

      {#if currentStepData}
        <TrainingStepViz step={currentStepData} algorithm={$trainingConfig.algorithm} />
      {/if}

      <div class="charts-row">
        <VocabGrowthChart steps={$trainingState.steps} currentStep={$trainingState.currentStep} />
        {#if currentStepData?.topPairs}
          <PairFrequencyChart pairs={currentStepData.topPairs} algorithm={$trainingConfig.algorithm} />
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .training-view {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 1.5rem;
    min-height: 500px;
  }

  .controls-panel {
    background: #253341;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #2d3d50;
  }

  .controls-panel h2 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: #667eea;
  }

  .control-group {
    margin-bottom: 1rem;
  }

  .control-group label {
    display: block;
    font-size: 0.85rem;
    color: #8899a6;
    margin-bottom: 0.3rem;
  }

  .control-group select,
  .control-group textarea,
  .control-group input[type="range"] {
    width: 100%;
    padding: 0.5rem;
    background: #192734;
    border: 1px solid #2d3d50;
    border-radius: 6px;
    color: #e7e9ea;
    font-size: 0.9rem;
  }

  .control-group textarea {
    resize: vertical;
    font-family: monospace;
  }

  .hint {
    font-size: 0.75rem;
    color: #667eea;
    font-style: italic;
  }

  .corpus-preview {
    margin-bottom: 1rem;
  }

  .corpus-preview label {
    font-size: 0.85rem;
    color: #8899a6;
    margin-bottom: 0.3rem;
    display: block;
  }

  .preview-text {
    font-size: 0.8rem;
    color: #657786;
    background: #192734;
    padding: 0.5rem;
    border-radius: 6px;
    max-height: 80px;
    overflow-y: auto;
    font-family: monospace;
    line-height: 1.4;
  }

  .train-btn {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .train-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .train-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .algo-explanation {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #192734;
    border-radius: 8px;
    border-left: 3px solid #667eea;
  }

  .algo-explanation h4 {
    font-size: 0.85rem;
    color: #667eea;
    margin-bottom: 0.5rem;
  }

  .algo-explanation ol {
    padding-left: 1.2rem;
    font-size: 0.8rem;
    color: #8899a6;
  }

  .algo-explanation li {
    margin-bottom: 0.25rem;
  }

  .visualization-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 400px;
    text-align: center;
    color: #657786;
  }

  .placeholder-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .playback-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #253341;
    border-radius: 10px;
    border: 1px solid #2d3d50;
  }

  .playback-controls button {
    padding: 0.4rem 0.8rem;
    background: #192734;
    border: 1px solid #2d3d50;
    border-radius: 6px;
    color: #e7e9ea;
    cursor: pointer;
    font-size: 1rem;
  }

  .playback-controls button:hover:not(:disabled) {
    background: #2d3d50;
  }

  .playback-controls button:disabled {
    opacity: 0.4;
  }

  .play-btn {
    background: linear-gradient(135deg, #667eea, #764ba2) !important;
    border: none !important;
  }

  .step-slider {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .step-slider input {
    flex: 1;
    accent-color: #667eea;
  }

  .step-label {
    font-size: 0.8rem;
    color: #8899a6;
    white-space: nowrap;
  }

  .speed-control {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .speed-control label {
    font-size: 0.8rem;
    color: #8899a6;
  }

  .speed-control select {
    padding: 0.3rem;
    background: #192734;
    border: 1px solid #2d3d50;
    border-radius: 4px;
    color: #e7e9ea;
    font-size: 0.8rem;
  }

  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 1000px) {
    .training-view {
      grid-template-columns: 1fr;
    }
    .charts-row {
      grid-template-columns: 1fr;
    }
  }
</style>
