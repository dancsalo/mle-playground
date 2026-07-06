<script lang="ts">
  import {
    createKarateGraph,
    createMoleculeGraph,
    DATASETS,
    initGCN,
    trainStepGCN,
    computeNormAdjacency,
    forward,
    crossEntropyLoss,
    computeAccuracy,
    computeTrainAccuracy,
    type GCNState,
    type ForwardResult,
    type Graph
  } from '$lib/gcn';
  import GraphView from '$lib/components/GraphView.svelte';
  import MessagePassingView from '$lib/components/MessagePassingView.svelte';
  import LossChart from '$lib/components/LossChart.svelte';
  import InferenceView from '$lib/components/InferenceView.svelte';
  import FeatureView from '$lib/components/FeatureView.svelte';
  import WeightsView from '$lib/components/WeightsView.svelte';
  import EmbeddingView from '$lib/components/EmbeddingView.svelte';

  // ─── State ─────────────────────────────────────────────────────────────────
  let datasetIndex = $state(0);
  let graph = $state<Graph>(DATASETS[0].create());
  let Anorm = $state(computeNormAdjacency(graph));
  let gcnState = $state<GCNState>(initGCN(graph, 8, 0.05));
  let forwardResult = $state<ForwardResult | undefined>(undefined);

  let selectedNode = $state(-1);
  let phase = $state<'explore' | 'training' | 'inference'>('explore');
  let highlightLayer = $state(1);
  let showMessages = $state(false);
  let autoTraining = $state(false);
  let autoInterval: ReturnType<typeof setInterval> | null = null;
  let speed = $state(300);
  let learningRate = $state(0.05);
  let hiddenDim = $state(8);

  // ─── Derived ───────────────────────────────────────────────────────────────
  let graphMode = $derived<'features' | 'predictions' | 'embeddings'>(
    phase === 'inference' ? 'predictions' : phase === 'training' && forwardResult ? 'predictions' : 'features'
  );

  let currentLoss = $derived(
    forwardResult ? crossEntropyLoss(forwardResult.predictions, graph) : null
  );

  let currentAccuracy = $derived(
    forwardResult ? computeAccuracy(forwardResult.predictedClasses, graph) : null
  );

  let trainAccuracy = $derived(
    forwardResult ? computeTrainAccuracy(forwardResult.predictedClasses, graph) : null
  );

  // ─── Actions ───────────────────────────────────────────────────────────────
  function changeDataset(idx: number) {
    datasetIndex = idx;
    graph = DATASETS[idx].create();
    Anorm = computeNormAdjacency(graph);
    resetModel();
  }

  function resetModel() {
    stopAuto();
    gcnState = initGCN(graph, hiddenDim, learningRate);
    forwardResult = undefined;
    phase = 'explore';
    selectedNode = -1;
  }

  function runForward() {
    forwardResult = forward(graph, gcnState.weights, Anorm);
    showMessages = true;
  }

  function doTrainStep() {
    gcnState = trainStepGCN(gcnState, Anorm);
    forwardResult = forward(graph, gcnState.weights, Anorm);
  }

  function trainMultiple(n: number) {
    for (let i = 0; i < n; i++) {
      gcnState = trainStepGCN(gcnState, Anorm);
    }
    forwardResult = forward(graph, gcnState.weights, Anorm);
  }

  function startAuto() {
    autoTraining = true;
    autoInterval = setInterval(() => {
      doTrainStep();
    }, speed);
  }

  function stopAuto() {
    autoTraining = false;
    if (autoInterval) {
      clearInterval(autoInterval);
      autoInterval = null;
    }
  }

  function toggleAuto() {
    if (autoTraining) stopAuto();
    else startAuto();
  }

  function enterTraining() {
    phase = 'training';
    runForward();
  }

  function enterInference() {
    phase = 'inference';
    stopAuto();
    forwardResult = forward(graph, gcnState.weights, Anorm);
  }

  function enterExplore() {
    phase = 'explore';
    stopAuto();
    showMessages = false;
    forwardResult = undefined;
  }

  // Cleanup
  $effect(() => {
    return () => {
      if (autoInterval) clearInterval(autoInterval);
    };
  });
</script>

<div id="app" class="min-w-[1100px]">
  <!-- Top Bar -->
  <header class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
    <div class="flex items-center gap-4 px-6 py-3">
      <div class="text-lg font-bold text-gray-800">
        <span class="text-[var(--gcn-primary)]">GCN</span> E<span class="text-sm">XPLORER</span>
        <span class="ml-2 text-[10px] font-normal text-gray-400">Graph Convolutional Networks</span>
      </div>

      <!-- Dataset selector -->
      <div class="flex items-center gap-2 text-sm">
        <span class="text-xs font-medium text-gray-500">Dataset:</span>
        <select
          class="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs"
          onchange={(e) => changeDataset(Number((e.target as HTMLSelectElement).value))}
        >
          {#each DATASETS as ds, i}
            <option value={i} selected={i === datasetIndex}>{ds.name}</option>
          {/each}
        </select>
      </div>

      <!-- Phase selector -->
      <div class="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
        <button
          class="rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors"
          class:bg-white={phase === 'explore'}
          class:shadow-sm={phase === 'explore'}
          class:text-indigo-700={phase === 'explore'}
          class:text-gray-500={phase !== 'explore'}
          onclick={enterExplore}
        >① Explore</button>
        <button
          class="rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors"
          class:bg-white={phase === 'training'}
          class:shadow-sm={phase === 'training'}
          class:text-indigo-700={phase === 'training'}
          class:text-gray-500={phase !== 'training'}
          onclick={enterTraining}
        >② Train</button>
        <button
          class="rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors"
          class:bg-white={phase === 'inference'}
          class:shadow-sm={phase === 'inference'}
          class:text-indigo-700={phase === 'inference'}
          class:text-gray-500={phase !== 'inference'}
          onclick={enterInference}
        >③ Inference</button>
      </div>

      <!-- Action buttons -->
      <div class="ml-auto flex items-center gap-2">
        {#if phase === 'training'}
          <span class="mono rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Epoch {gcnState.epoch}
          </span>
          <button
            onclick={doTrainStep}
            class="step-btn rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            ⏩ Train 1 Epoch
          </button>
          <button
            onclick={() => trainMultiple(10)}
            class="rounded-lg bg-indigo-100 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
          >
            ×10
          </button>
          <button
            onclick={() => trainMultiple(50)}
            class="rounded-lg bg-indigo-100 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
          >
            ×50
          </button>
          <button
            onclick={toggleAuto}
            class="rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            class:bg-red-100={autoTraining}
            class:text-red-700={autoTraining}
            class:bg-gray-100={!autoTraining}
            class:text-gray-700={!autoTraining}
          >
            {autoTraining ? '⏸ Stop' : '▶ Auto'}
          </button>
        {/if}
        <button
          onclick={resetModel}
          class="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="px-6 py-4">
    <!-- Phase Description -->
    <section class="mb-4 rounded-xl border p-4"
             class:border-blue-100={phase === 'explore'}
             class:bg-blue-50={phase === 'explore'}
             class:border-purple-100={phase === 'training'}
             class:bg-purple-50={phase === 'training'}
             class:border-emerald-100={phase === 'inference'}
             class:bg-emerald-50={phase === 'inference'}>
      {#if phase === 'explore'}
        <div class="flex items-center gap-3">
          <span class="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase text-blue-700">Explore</span>
          <span class="text-sm text-gray-700">
            Examine the graph structure, node features, and how message passing aggregates neighborhood information.
          </span>
          <button
            onclick={runForward}
            class="ml-auto rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-blue-700"
          >
            Run Forward Pass →
          </button>
        </div>
      {:else if phase === 'training'}
        <div class="flex items-center gap-3">
          <span class="rounded-full bg-purple-100 px-3 py-1 text-[10px] font-bold uppercase text-purple-700">Training</span>
          <span class="text-sm text-gray-700">
            Train the GCN on <strong>labeled</strong> nodes. Watch how weights and predictions evolve.
          </span>
          {#if currentLoss !== null}
            <div class="ml-auto flex gap-4 text-xs">
              <span class="text-red-600">Loss: <strong class="mono">{currentLoss.toFixed(4)}</strong></span>
              <span class="text-emerald-600">Train Acc: <strong class="mono">{((trainAccuracy ?? 0) * 100).toFixed(1)}%</strong></span>
              <span class="text-blue-600">Total Acc: <strong class="mono">{((currentAccuracy ?? 0) * 100).toFixed(1)}%</strong></span>
            </div>
          {/if}
        </div>
      {:else}
        <div class="flex items-center gap-3">
          <span class="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">Inference</span>
          <span class="text-sm text-gray-700">
            Apply the trained model to <strong>unlabeled</strong> nodes. The GCN uses learned features + neighborhood structure to predict classes.
          </span>
          {#if currentAccuracy !== null}
            <span class="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              {((currentAccuracy) * 100).toFixed(0)}% overall accuracy
            </span>
          {/if}
        </div>
      {/if}
    </section>

    <!-- Two-Column Layout -->
    <div class="grid grid-cols-[1fr_380px] gap-4">

      <!-- Left: Graph + Feature View -->
      <div class="space-y-4">
        <!-- Graph Visualization -->
        <GraphView
          {graph}
          {forwardResult}
          bind:selectedNode
          {highlightLayer}
          showMessages={showMessages && selectedNode >= 0}
          mode={graphMode}
        />

        <!-- Feature View -->
        <FeatureView {graph} {selectedNode} />

        <!-- Message Passing (if forward has been run) -->
        {#if forwardResult && (phase === 'explore' || phase === 'training')}
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-semibold text-gray-500">Show layer:</span>
              <button
                class="rounded px-2 py-0.5 text-[9px] font-medium transition-colors"
                class:bg-purple-500={highlightLayer === 1}
                class:text-white={highlightLayer === 1}
                class:bg-gray-100={highlightLayer !== 1}
                onclick={() => { highlightLayer = 1; showMessages = true; }}
              >Layer 1</button>
              <button
                class="rounded px-2 py-0.5 text-[9px] font-medium transition-colors"
                class:bg-pink-500={highlightLayer === 2}
                class:text-white={highlightLayer === 2}
                class:bg-gray-100={highlightLayer !== 2}
                onclick={() => { highlightLayer = 2; showMessages = true; }}
              >Layer 2</button>
            </div>
            <MessagePassingView
              {graph}
              {forwardResult}
              {selectedNode}
              layer={highlightLayer}
            />
          </div>
        {/if}
      </div>

      <!-- Right: Training / Inference Panel -->
      <div class="space-y-4">
        {#if phase === 'training' || (phase === 'explore' && forwardResult)}
          <!-- Loss Chart -->
          <LossChart history={gcnState.history} />

          <!-- Weights -->
          <WeightsView weights={gcnState.weights} epoch={gcnState.epoch} />

          <!-- Embeddings -->
          {#if forwardResult}
            <EmbeddingView {graph} {forwardResult} {selectedNode} />
          {/if}
        {/if}

        {#if phase === 'inference' && forwardResult}
          <!-- Inference Results -->
          <InferenceView {graph} {forwardResult} />

          <!-- Also show embeddings in inference mode -->
          <EmbeddingView {graph} {forwardResult} {selectedNode} />

          <!-- Weights (frozen in inference) -->
          <WeightsView weights={gcnState.weights} epoch={gcnState.epoch} />
        {/if}

        {#if phase === 'explore' && !forwardResult}
          <!-- Intro panel -->
          <div class="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h3 class="mb-2 text-sm font-bold text-blue-800">What is a GCN?</h3>
            <p class="text-xs leading-relaxed text-blue-700">
              A <strong>Graph Convolutional Network</strong> learns node representations by
              iteratively aggregating features from each node's neighborhood.
            </p>
            <div class="mt-3 space-y-2 text-[10px] text-blue-600">
              <div class="flex items-start gap-2">
                <span class="font-bold text-blue-800">1.</span>
                <span>Each node starts with an input feature vector (H⁰)</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="font-bold text-blue-800">2.</span>
                <span>In each layer, nodes collect ("aggregate") their neighbors' features</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="font-bold text-blue-800">3.</span>
                <span>Aggregated features are transformed via learned weight matrices</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="font-bold text-blue-800">4.</span>
                <span>After L layers, each node's representation encodes its L-hop neighborhood</span>
              </div>
            </div>
            <div class="mono mt-4 rounded bg-white/60 p-2 text-[10px] text-blue-800">
              H<sup>(l+1)</sup> = σ( D̃<sup>-½</sup> Ã D̃<sup>-½</sup> H<sup>(l)</sup> W<sup>(l)</sup> )
            </div>
          </div>

          <!-- Graph stats -->
          <div class="rounded-lg border border-gray-200 bg-white p-4">
            <h3 class="mb-2 text-xs font-bold text-gray-700">Graph Statistics</h3>
            <div class="grid grid-cols-2 gap-2 text-[10px]">
              <div class="rounded bg-gray-50 p-2">
                <span class="text-gray-500">Nodes:</span>
                <span class="mono ml-1 font-bold">{graph.nodes.length}</span>
              </div>
              <div class="rounded bg-gray-50 p-2">
                <span class="text-gray-500">Edges:</span>
                <span class="mono ml-1 font-bold">{graph.edges.length}</span>
              </div>
              <div class="rounded bg-gray-50 p-2">
                <span class="text-gray-500">Classes:</span>
                <span class="mono ml-1 font-bold">{graph.numClasses}</span>
              </div>
              <div class="rounded bg-gray-50 p-2">
                <span class="text-gray-500">Labeled:</span>
                <span class="mono ml-1 font-bold">{graph.nodes.filter(n => n.isLabeled).length}/{graph.nodes.length}</span>
              </div>
              <div class="rounded bg-gray-50 p-2">
                <span class="text-gray-500">Features:</span>
                <span class="mono ml-1 font-bold">{graph.nodes[0].features.length}D</span>
              </div>
              <div class="rounded bg-gray-50 p-2">
                <span class="text-gray-500">Hidden dim:</span>
                <span class="mono ml-1 font-bold">{hiddenDim}</span>
              </div>
            </div>
          </div>
        {/if}

        <!-- Hyperparameters (always visible during training) -->
        {#if phase === 'training'}
          <div class="rounded-lg border border-gray-200 bg-white p-4">
            <h3 class="mb-2 text-xs font-bold text-gray-700">Hyperparameters</h3>
            <div class="space-y-2">
              <label class="flex items-center justify-between text-[11px]">
                <span class="text-gray-600">Learning Rate</span>
                <div class="flex items-center gap-1">
                  <input type="range" min="0.005" max="0.2" step="0.005" bind:value={learningRate}
                         oninput={() => { gcnState.learningRate = learningRate; }}
                         class="w-20" />
                  <span class="mono w-10">{learningRate.toFixed(3)}</span>
                </div>
              </label>
              <label class="flex items-center justify-between text-[11px]">
                <span class="text-gray-600">Speed (ms)</span>
                <div class="flex items-center gap-1">
                  <input type="range" min="50" max="1000" step="50" bind:value={speed}
                         oninput={() => { if (autoTraining) { stopAuto(); startAuto(); } }}
                         class="w-20" />
                  <span class="mono w-10">{speed}ms</span>
                </div>
              </label>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- ═══════════════ Educational Footer ═══════════════ -->
    <section class="mt-8 rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-bold text-gray-800">How GCNs Work</h2>

      <div class="grid grid-cols-3 gap-6 text-sm text-gray-600">
        <div>
          <h3 class="mb-2 font-semibold text-blue-700">① Message Passing</h3>
          <p class="text-xs leading-relaxed">
            Each node collects features from its neighbors. In a GCN, messages are scaled by
            <strong>1/√(deg(i)·deg(j))</strong> — the symmetric normalization.
            This prevents high-degree nodes from dominating.
          </p>
          <div class="mt-2 rounded bg-blue-50 p-2 text-[10px]">
            <strong>Key insight:</strong> After L layers of message passing, each node's
            representation captures information from its L-hop neighborhood. The network
            effectively "smooths" features over the graph.
          </div>
        </div>

        <div>
          <h3 class="mb-2 font-semibold text-purple-700">② Training (Node Classification)</h3>
          <p class="text-xs leading-relaxed">
            We have labels for a <strong>subset</strong> of nodes. Cross-entropy loss is computed
            only on labeled nodes, but gradients flow through the entire graph during backprop
            — unlabeled nodes still get useful representations!
          </p>
          <div class="mt-2 rounded bg-purple-50 p-2 text-[10px]">
            <strong>Key insight:</strong> This is <em>semi-supervised learning</em>. The graph
            structure acts as an inductive bias, encouraging connected nodes to share
            similar representations (homophily assumption).
          </div>
        </div>

        <div>
          <h3 class="mb-2 font-semibold text-emerald-700">③ Inference</h3>
          <p class="text-xs leading-relaxed">
            At inference time, the trained model runs a forward pass over all nodes.
            Unlabeled nodes get classified based on their <strong>features + neighborhood
            context</strong>. No retraining needed.
          </p>
          <div class="mt-2 rounded bg-emerald-50 p-2 text-[10px]">
            <strong>Key insight:</strong> Even if a node's own features are ambiguous,
            the GCN can correctly classify it by leveraging its neighbors' information.
            This is the power of graph-based learning.
          </div>
        </div>
      </div>

      <div class="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
        <h3 class="mb-2 text-sm font-bold text-indigo-800">The GCN Formula</h3>
        <div class="mono text-sm text-indigo-700">
          H<sup>(l+1)</sup> = σ( D̃<sup>-½</sup> Ã D̃<sup>-½</sup> H<sup>(l)</sup> W<sup>(l)</sup> )
        </div>
        <div class="mt-2 grid grid-cols-2 gap-2 text-[10px] text-indigo-600">
          <div><strong>Ã = A + I</strong> — adjacency matrix with self-loops</div>
          <div><strong>D̃</strong> — degree matrix of Ã</div>
          <div><strong>H<sup>(l)</sup></strong> — node features at layer l</div>
          <div><strong>W<sup>(l)</sup></strong> — learnable weight matrix</div>
          <div><strong>σ</strong> — ReLU (hidden) or Softmax (output)</div>
          <div><strong>D̃<sup>-½</sup> Ã D̃<sup>-½</sup></strong> — symmetric normalization</div>
        </div>
        <p class="mt-3 text-xs leading-relaxed text-indigo-600">
          The normalization ensures that aggregating over neighbors gives a <em>weighted average</em>
          rather than a sum that scales with node degree. This is what makes GCNs work on graphs
          with varying connectivity — the same architecture handles both hub nodes and leaf nodes gracefully.
        </p>
      </div>

      <div class="mt-4 rounded border border-gray-100 bg-gray-50 p-3 text-[10px] text-gray-500">
        <strong>Reference:</strong> Kipf & Welling, "Semi-Supervised Classification with Graph Convolutional Networks" (ICLR 2017).
        Visualization inspired by <a href="https://distill.pub/2021/gnn-intro/" class="text-indigo-600 underline" target="_blank">Distill: A Gentle Introduction to Graph Neural Networks</a>.
      </div>
    </section>
  </main>
</div>
