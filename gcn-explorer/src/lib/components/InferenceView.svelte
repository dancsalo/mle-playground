<script lang="ts">
  import type { Graph, ForwardResult } from '$lib/gcn';

  let {
    graph,
    forwardResult
  }: {
    graph: Graph;
    forwardResult: ForwardResult;
  } = $props();

  // Show predictions for unlabeled nodes (inference)
  let unlabeledNodes = $derived(graph.nodes.filter(n => !n.isLabeled));
  let allNodes = $derived(graph.nodes);

  function getConfidence(nodeId: number): number {
    return Math.max(...forwardResult.predictions[nodeId]);
  }

  function getPredictedClass(nodeId: number): number {
    return forwardResult.predictedClasses[nodeId];
  }

  function isCorrect(nodeId: number): boolean {
    return forwardResult.predictedClasses[nodeId] === graph.nodes[nodeId].trueClass;
  }
</script>

<div class="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
  <div class="mb-2 flex items-center gap-2">
    <div class="h-2 w-2 rounded-full bg-indigo-500"></div>
    <span class="text-[10px] font-bold uppercase text-indigo-700">
      Inference Results
    </span>
    <span class="ml-auto text-[9px] text-gray-400">
      {allNodes.filter(n => isCorrect(n.id)).length}/{allNodes.length} correct
    </span>
  </div>

  <!-- Unlabeled nodes (the "inference" targets) -->
  <div class="mb-2">
    <span class="text-[9px] font-semibold text-gray-500">Unlabeled Nodes (inference targets):</span>
  </div>

  <div class="space-y-1.5">
    {#each unlabeledNodes as node}
      {@const pred = getPredictedClass(node.id)}
      {@const conf = getConfidence(node.id)}
      {@const correct = isCorrect(node.id)}
      <div class="flex items-center gap-2 rounded-md bg-white/80 px-2 py-1.5">
        <!-- Node name -->
        <span class="w-12 text-[10px] font-medium text-gray-700">{node.label}</span>

        <!-- Prediction bars -->
        <div class="flex-1">
          <div class="flex h-4 gap-0.5 overflow-hidden rounded">
            {#each forwardResult.predictions[node.id] as prob, classIdx}
              <div
                class="prob-bar flex items-center justify-center text-[7px] font-bold text-white"
                style="width: {prob * 100}%; background-color: {graph.classColors[classIdx]}; min-width: {prob > 0.05 ? '12px' : '2px'}"
              >
                {#if prob > 0.15}
                  {(prob * 100).toFixed(0)}%
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- Predicted class -->
        <span class="rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white"
              style="background-color: {graph.classColors[pred]}">
          {graph.classNames[pred]}
        </span>

        <!-- Correct/incorrect indicator -->
        <span class="text-[10px]" title={correct ? 'Correct' : 'Incorrect'}>
          {correct ? '✓' : '✗'}
        </span>
      </div>
    {/each}
  </div>

  <!-- Summary -->
  <div class="mt-3 border-t border-indigo-100 pt-2">
    <div class="flex items-center justify-between text-[9px]">
      <span class="text-gray-500">Unlabeled accuracy:</span>
      <span class="mono font-bold"
            class:text-emerald-600={unlabeledNodes.filter(n => isCorrect(n.id)).length === unlabeledNodes.length}
            class:text-amber-600={unlabeledNodes.filter(n => isCorrect(n.id)).length < unlabeledNodes.length}>
        {unlabeledNodes.filter(n => isCorrect(n.id)).length}/{unlabeledNodes.length}
        ({(unlabeledNodes.filter(n => isCorrect(n.id)).length / unlabeledNodes.length * 100).toFixed(0)}%)
      </span>
    </div>
    <p class="mt-1 text-[8px] text-indigo-600">
      The GCN leverages both node features <em>and</em> graph structure to classify unlabeled nodes.
      Neighbors' information propagates through message passing layers.
    </p>
  </div>
</div>
