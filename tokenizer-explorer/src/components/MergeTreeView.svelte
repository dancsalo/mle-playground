<script>
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';
  import { trainingState, TOKENIZER_TYPES, SAMPLE_CORPORA, trainingConfig, TOKEN_COLORS } from '../stores/index.js';
  import { buildMergeTree } from '../lib/utils.js';
  import { BPETokenizer } from '../algorithms/bpe.js';

  let treeContainer;
  let mergeTree = null;
  let selectedCorpus = 'english';
  let numMerges = 30;
  let hoveredNode = null;

  function buildTree() {
    const tokenizer = new BPETokenizer();
    const corpus = SAMPLE_CORPORA[selectedCorpus]?.text || '';
    tokenizer.train(corpus, numMerges);
    const merges = tokenizer.getMerges();
    mergeTree = buildMergeTree(merges);
    if (treeContainer) drawTree();
  }

  afterUpdate(() => {
    if (treeContainer && mergeTree) drawTree();
  });

  function drawTree() {
    d3.select(treeContainer).selectAll('*').remove();

    if (!mergeTree || !mergeTree.children || mergeTree.children.length === 0) return;

    const width = treeContainer.clientWidth;
    const height = 500;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    const svg = d3.select(treeContainer)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create a tree layout for each root
    const trees = mergeTree.children.filter(c => c.children && c.children.length > 0);
    
    if (trees.length === 0) return;

    // Lay them out side by side
    const treeWidth = innerWidth / Math.min(trees.length, 6);

    trees.slice(0, 6).forEach((root, treeIdx) => {
      const treeG = g.append('g')
        .attr('transform', `translate(${treeIdx * treeWidth + treeWidth / 2}, 0)`);

      const hierarchy = d3.hierarchy(root);
      const treeLayout = d3.tree()
        .size([treeWidth * 0.8, innerHeight - 40]);

      treeLayout(hierarchy);

      // Links
      treeG.selectAll('.link')
        .data(hierarchy.links())
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
          .x(d => d.x - treeWidth * 0.4)
          .y(d => d.y)
        )
        .attr('fill', 'none')
        .attr('stroke', '#667eea50')
        .attr('stroke-width', 1.5);

      // Nodes
      const nodes = treeG.selectAll('.node')
        .data(hierarchy.descendants())
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x - treeWidth * 0.4},${d.y})`);

      // Node circles
      nodes.append('circle')
        .attr('r', d => d.children ? 8 : 6)
        .attr('fill', d => d.children ? '#667eea' : '#764ba2')
        .attr('stroke', '#e7e9ea')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', d.children ? 11 : 9);
          hoveredNode = d.data.name;
        })
        .on('mouseout', function(event, d) {
          d3.select(this).attr('r', d.children ? 8 : 6);
          hoveredNode = null;
        });

      // Labels
      nodes.append('text')
        .attr('dy', d => d.children ? -14 : 18)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e7e9ea')
        .attr('font-size', d => d.children ? '11px' : '9px')
        .attr('font-family', 'monospace')
        .text(d => d.data.name.length > 8 ? d.data.name.slice(0, 8) + '…' : d.data.name);
    });

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8899a6')
      .attr('font-size', '12px')
      .text(`BPE Merge Trees (showing ${Math.min(trees.length, 6)} of ${trees.length} trees)`);
  }
</script>

<div class="merge-tree-view">
  <div class="header">
    <h2>🌳 BPE Merge Tree</h2>
    <p class="desc">
      Visualize how BPE builds up tokens through successive merges.
      Each tree shows a final token and how it was constructed from character-level pieces.
    </p>
  </div>

  <div class="controls">
    <div class="control-group">
      <label>Training Corpus:</label>
      <select bind:value={selectedCorpus}>
        {#each Object.entries(SAMPLE_CORPORA) as [key, info]}
          <option value={key}>{info.name}</option>
        {/each}
      </select>
    </div>

    <div class="control-group">
      <label>Merges: {numMerges}</label>
      <input type="range" min="5" max="60" bind:value={numMerges} />
    </div>

    <button class="build-btn" on:click={buildTree}>
      🌳 Build Merge Tree
    </button>
  </div>

  {#if hoveredNode}
    <div class="hover-info">
      Token: <strong>{hoveredNode}</strong> (length: {hoveredNode.length})
    </div>
  {/if}

  <div class="tree-container" bind:this={treeContainer}>
    {#if !mergeTree}
      <div class="placeholder">
        <p>Click <strong>Build Merge Tree</strong> to visualize the BPE merge hierarchy.</p>
        <p class="sub">Trees show how multi-character tokens are built up from individual characters through successive merge operations.</p>
      </div>
    {/if}
  </div>

  <div class="explanation">
    <h4>How to Read This:</h4>
    <ul>
      <li><span class="dot parent"></span> <strong>Purple nodes</strong> = leaf characters (original alphabet)</li>
      <li><span class="dot merged"></span> <strong>Blue nodes</strong> = merged tokens (created by combining children)</li>
      <li>Each tree represents one "family" of merges that built up a specific token</li>
      <li>Deeper trees = tokens that required more merge steps to create</li>
    </ul>
  </div>
</div>

<style>
  .merge-tree-view {
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
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
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
    padding: 0.5rem;
    background: #253341;
    border: 1px solid #2d3d50;
    border-radius: 6px;
    color: #e7e9ea;
    min-width: 150px;
  }

  .build-btn {
    padding: 0.6rem 1.25rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
  }

  .build-btn:hover { opacity: 0.9; }

  .hover-info {
    padding: 0.5rem 1rem;
    background: #253341;
    border-radius: 8px;
    font-family: monospace;
    font-size: 0.9rem;
    border: 1px solid #667eea50;
  }

  .tree-container {
    background: #253341;
    border-radius: 12px;
    border: 1px solid #2d3d50;
    min-height: 500px;
    overflow-x: auto;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    text-align: center;
    color: #657786;
  }

  .placeholder .sub {
    font-size: 0.85rem;
    margin-top: 0.5rem;
    max-width: 500px;
  }

  .explanation {
    background: #253341;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    border: 1px solid #2d3d50;
  }

  .explanation h4 {
    font-size: 0.9rem;
    color: #8899a6;
    margin-bottom: 0.5rem;
  }

  .explanation ul {
    list-style: none;
    padding: 0;
  }

  .explanation li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #8899a6;
    margin-bottom: 0.3rem;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
  }

  .dot.parent {
    background: #764ba2;
  }

  .dot.merged {
    background: #667eea;
  }
</style>
