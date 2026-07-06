<script lang="ts">
  import type { DocumentData, CandidatePair } from '$lib/lsh';

  let { documents, candidatePairs, pairSimilarities, expanded }: {
    documents: DocumentData[];
    candidatePairs: CandidatePair[];
    pairSimilarities: { docA: number; docB: number; jaccard: number; sigSim: number }[];
    expanded: boolean;
  } = $props();
</script>

<div class="space-y-3">
  <!-- Candidate pairs list -->
  <div class="text-[10px] text-gray-600">
    <strong>{candidatePairs.length}</strong> candidate pair{candidatePairs.length !== 1 ? 's' : ''} found
  </div>

  {#each pairSimilarities as pair}
    {@const isCandidate = candidatePairs.some(
      (cp) => cp.docA === pair.docA && cp.docB === pair.docB
    )}
    <div
      class="flex items-center gap-2 rounded-lg border p-2 transition-all"
      class:border-[var(--lsh-primary)]={isCandidate}
      class:bg-purple-50={isCandidate}
      class:border-gray-100={!isCandidate}
      class:opacity-40={!isCandidate}
    >
      <div class="flex items-center gap-1">
        <span
          class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style="background-color: {documents[pair.docA].color}"
        >{documents[pair.docA].label}</span>
        <span class="text-[10px] text-gray-400">↔</span>
        <span
          class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style="background-color: {documents[pair.docB].color}"
        >{documents[pair.docB].label}</span>
      </div>
      <div class="mono flex-1 text-right text-[10px]">
        <span class="text-gray-500">J={pair.jaccard.toFixed(3)}</span>
        {#if expanded}
          <span class="ml-1 text-gray-400">sig={pair.sigSim.toFixed(3)}</span>
        {/if}
      </div>
      {#if isCandidate}
        <span class="text-[10px] font-medium text-[var(--lsh-primary)]">✓</span>
      {:else}
        <span class="text-[10px] text-gray-300">✗</span>
      {/if}
    </div>
  {/each}

  {#if expanded}
    <div class="mt-2 border-t border-gray-100 pt-2 text-[10px] text-gray-500">
      <p><strong>J</strong> = Jaccard similarity (ground truth on shingle sets)</p>
      <p><strong>sig</strong> = Signature similarity (fraction of matching positions)</p>
      <p><span class="text-[var(--lsh-primary)]">✓</span> = identified as candidate by LSH banding</p>
    </div>
  {/if}
</div>
