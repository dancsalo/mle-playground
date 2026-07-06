<script lang="ts">
  import type { DocumentData } from '$lib/lsh';
  import { generatePermutation } from '$lib/lsh';

  let { documents, vocab, expanded }: {
    documents: DocumentData[];
    vocab: string[];
    expanded: boolean;
  } = $props();

  const VISIBLE_ROWS = 12;
  let showFullMatrix = $state(false);

  // Generate first permutation for display
  let firstPerm = $derived(generatePermutation(vocab.length, 42));
  let visibleVocab = $derived(
    expanded && showFullMatrix
      ? vocab
      : vocab.slice(0, VISIBLE_ROWS)
  );
</script>

<div class="space-y-3">
  <!-- Signature bars (always visible) -->
  {#each documents as doc}
    <div>
      <div class="mb-1 flex items-center gap-1">
        <span
          class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style="background-color: {doc.color}"
        >{doc.label}</span>
        <span class="mono text-[10px] text-gray-500">sig[{doc.signature.length}]</span>
      </div>
      <div class="flex gap-0 overflow-hidden rounded">
        {#each doc.signature as val, i}
          <div
            class="h-4 min-w-0 flex-1 rounded-[0px]"
            style="background-color: {doc.color}; opacity: {0.2 + (val / vocab.length) * 0.8}"
            title="sig[{i}] = {val}"
          ></div>
        {/each}
      </div>
    </div>
  {/each}

  <!-- Expanded: show permutation matrix -->
  {#if expanded}
    <div class="mt-3 border-t border-gray-100 pt-3">
      <div class="mb-2 text-[10px] font-medium text-gray-600">
        Permutation Matrix (hash function #1)
      </div>
      <div class="overflow-x-auto">
        <table class="mono w-full text-[9px]">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="px-1 py-0.5 text-left text-gray-400">π</th>
              <th class="px-1 py-0.5 text-left text-gray-400">vocab</th>
              {#each documents as doc}
                <th class="px-1 py-0.5 text-center" style="color: {doc.color}">{doc.label}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each visibleVocab as _, rowIdx}
              {@const permIdx = firstPerm[rowIdx]}
              {@const shingle = vocab[permIdx]}
              {@const isFirstHit = documents.map(doc => {
                // Check if this is the first 1 we encounter for this doc
                for (let r = 0; r <= rowIdx; r++) {
                  if (doc.oneHot[firstPerm[r]] === 1) {
                    return r === rowIdx;
                  }
                }
                return false;
              })}
              <tr class="border-b border-gray-50" class:bg-purple-50={isFirstHit.some(Boolean)}>
                <td class="px-1 py-0.5 text-gray-400">{rowIdx + 1}</td>
                <td class="px-1 py-0.5 text-gray-600 max-w-[60px] truncate" title={shingle}>
                  {shingle}
                </td>
                {#each documents as doc, di}
                  {@const val = doc.oneHot[permIdx]}
                  <td class="px-1 py-0.5 text-center">
                    {#if val === 1}
                      {#if isFirstHit[di]}
                        <span class="font-bold text-[var(--lsh-primary)]">1</span>
                      {:else}
                        <span class="text-gray-800">1</span>
                      {/if}
                    {:else}
                      <span class="text-gray-300">0</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if vocab.length > VISIBLE_ROWS}
        <button
          onclick={() => showFullMatrix = !showFullMatrix}
          class="mt-1 text-[10px] text-[var(--lsh-primary)] hover:underline"
        >
          {showFullMatrix ? 'Show less' : `... ${vocab.length - VISIBLE_ROWS} more rows`}
        </button>
      {/if}

      <div class="mt-2 text-[10px] text-gray-500">
        <strong>Reading:</strong> Count from row 1 down. The first row where a column has <span class="font-bold text-[var(--lsh-primary)]">1</span> → that row number becomes sig[0] for that document.
      </div>
    </div>
  {/if}
</div>
