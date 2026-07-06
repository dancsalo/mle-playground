<script>
  import { activeView } from './stores/index.js';
  import TrainingView from './components/TrainingView.svelte';
  import TokenizeView from './components/TokenizeView.svelte';
  import ComparisonView from './components/ComparisonView.svelte';
  import CorpusInfluenceView from './components/CorpusInfluenceView.svelte';
  import MergeTreeView from './components/MergeTreeView.svelte';

  const views = [
    { id: 'training', label: 'Training Visualization', icon: '🔧' },
    { id: 'tokenize', label: 'Tokenize Text', icon: '✂️' },
    { id: 'comparison', label: 'Algorithm Comparison', icon: '📊' },
    { id: 'corpus', label: 'Corpus Influence', icon: '📚' },
    { id: 'mergetree', label: 'Merge Tree', icon: '🌳' },
  ];
</script>

<main>
  <header>
    <h1>🔤 Tokenizer Explorer</h1>
    <p class="subtitle">
      Visualize how tokenizers are trained and how they segment text.
      Compare BPE, WordPiece, and Unigram algorithms side-by-side.
    </p>
  </header>

  <nav>
    {#each views as view}
      <button
        class="nav-btn"
        class:active={$activeView === view.id}
        on:click={() => $activeView = view.id}
      >
        <span class="icon">{view.icon}</span>
        <span class="label">{view.label}</span>
      </button>
    {/each}
  </nav>

  <section class="content">
    {#if $activeView === 'training'}
      <TrainingView />
    {:else if $activeView === 'tokenize'}
      <TokenizeView />
    {:else if $activeView === 'comparison'}
      <ComparisonView />
    {:else if $activeView === 'corpus'}
      <CorpusInfluenceView />
    {:else if $activeView === 'mergetree'}
      <MergeTreeView />
    {/if}
  </section>
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0f1419;
    color: #e7e9ea;
    line-height: 1.6;
  }

  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #8899a6;
    font-size: 1rem;
    max-width: 600px;
    margin: 0 auto;
  }

  nav {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 2rem;
    padding: 0.5rem;
    background: #192734;
    border-radius: 12px;
    border: 1px solid #2d3d50;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: none;
    background: transparent;
    color: #8899a6;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .nav-btn:hover {
    background: #253341;
    color: #e7e9ea;
  }

  .nav-btn.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
  }

  .icon {
    font-size: 1.1rem;
  }

  .content {
    background: #192734;
    border-radius: 16px;
    border: 1px solid #2d3d50;
    padding: 2rem;
    min-height: 600px;
  }

  @media (max-width: 768px) {
    main {
      padding: 1rem;
    }

    .nav-btn .label {
      display: none;
    }

    .content {
      padding: 1rem;
    }
  }
</style>
