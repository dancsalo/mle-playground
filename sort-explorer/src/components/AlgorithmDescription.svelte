<script>
  import { selectedAlgorithm } from '../stores/sortStore.js';

  const descriptions = {
    bubble: {
      title: 'Bubble Sort',
      how: 'Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted.',
      visualization: 'Watch the largest unsorted element "bubble up" to its correct position at the end of the array with each pass. Green bars accumulate from the right.',
      when: 'Educational purposes; nearly sorted data (adaptive variant).',
      analogy: 'Like bubbles rising in water — larger values float to the top.',
    },
    selection: {
      title: 'Selection Sort',
      how: 'Finds the minimum element from the unsorted part and places it at the beginning. Repeats for each position.',
      visualization: 'A yellow highlight scans right to find the minimum, then a red swap places it at the leftmost unsorted position. Green bars accumulate from the left.',
      when: 'When memory writes are expensive (only O(n) swaps).',
      analogy: 'Like selecting the shortest person from a line and moving them to the front, one by one.',
    },
    insertion: {
      title: 'Insertion Sort',
      how: 'Builds the sorted array one item at a time by picking each element and inserting it into its correct position among the already-sorted elements.',
      visualization: 'Each new element slides left through the sorted portion until it finds its place. Watch elements shift right to make room.',
      when: 'Small arrays, nearly sorted data, online sorting (streaming data).',
      analogy: 'Like sorting playing cards in your hand — pick up one card at a time and slide it into place.',
    },
    merge: {
      title: 'Merge Sort',
      how: 'Divides the array in half recursively until single elements remain, then merges sorted halves back together.',
      visualization: 'Blue highlights show the active merge region. Elements are placed in order during the merge step. The pattern shows divide-and-conquer depth.',
      when: 'Guaranteed O(n log n); stable sort needed; linked lists; external sorting.',
      analogy: 'Like sorting two decks of cards separately, then merging them by always picking the smaller top card.',
    },
    quick: {
      title: 'Quick Sort',
      how: 'Picks a pivot element, partitions the array into elements less than and greater than the pivot, then recursively sorts the partitions.',
      visualization: 'Purple bar marks the pivot. Yellow comparisons sweep through the partition region. After partitioning, the pivot turns green (in final position).',
      when: 'General-purpose sorting; in-place needed; cache-friendly.',
      analogy: 'Like organizing a group by height — pick someone as reference, shorter people go left, taller go right, then repeat in each group.',
    },
    heap: {
      title: 'Heap Sort',
      how: 'Builds a max-heap from the array, then repeatedly extracts the maximum element and places it at the end.',
      visualization: 'First phase builds the heap (swaps ripple down). Second phase extracts max to the right — green bars grow from the right as elements reach final position.',
      when: 'Guaranteed O(n log n) with O(1) space; no worst-case degradation.',
      analogy: 'Like a tournament bracket — the winner (max) is always at the top; remove them, re-run the tournament, repeat.',
    },
    shell: {
      title: 'Shell Sort',
      how: 'Generalization of insertion sort that allows swapping far-apart elements. Uses a decreasing gap sequence, doing insertion sort for each gap.',
      visualization: 'Elements far apart are compared and swapped first (large gaps). As the gap shrinks, the array becomes nearly sorted, and final passes are fast.',
      when: 'Medium-sized arrays; embedded systems (simple code, no recursion).',
      analogy: 'Like roughly organizing books by size first (every 5th book), then refining (every 3rd), then fine-tuning (adjacent).',
    },
    counting: {
      title: 'Counting Sort',
      how: 'Counts occurrences of each value, then reconstructs the sorted array from the counts. Not comparison-based.',
      visualization: 'First pass scans and counts (yellow). Second pass writes values back in order — watch the array rebuild from left to right.',
      when: 'Integer values with small range (k); when k = O(n).',
      analogy: 'Like sorting mail by zip code — count how many letters go to each zip, then place them in order.',
    },
    radix: {
      title: 'Radix Sort',
      how: 'Sorts numbers digit by digit, from least significant to most significant (LSD), using a stable sort (counting sort) for each digit.',
      visualization: 'Multiple passes over the array, each sorting by the next digit. Watch the array gradually become more ordered with each pass.',
      when: 'Fixed-length integers or strings; when d (digits) is small.',
      analogy: 'Like sorting words in a dictionary — first by last letter, then second-to-last, etc., until sorted by first letter.',
    },
    bucket: {
      title: 'Bucket Sort',
      how: 'Distributes elements into buckets based on value ranges, sorts each bucket individually, then concatenates.',
      visualization: 'Elements are distributed to buckets (first pass), each bucket is sorted, then merged back. Watch segments of the array become sorted.',
      when: 'Uniformly distributed data; floating-point numbers in [0,1).',
      analogy: 'Like sorting students by grade range into bins (A, B, C...), sorting within each bin, then combining.',
    },
    tim: {
      title: 'Tim Sort',
      how: 'Hybrid algorithm: divides array into small runs, sorts each with insertion sort, then merges runs like merge sort. Exploits existing order.',
      visualization: 'First phase shows insertion sort on small chunks (runs). Second phase merges runs — blue highlights show active merge regions growing larger.',
      when: 'Real-world data (often partially sorted). Default in Python and Java.',
      analogy: 'Like organizing a messy bookshelf — first straighten small sections, then merge adjacent sorted sections into larger ones.',
    },
  };

  $: desc = descriptions[$selectedAlgorithm];
</script>

<div class="description">
  <h3>{desc.title}</h3>
  <div class="section">
    <strong>How it works:</strong>
    <p>{desc.how}</p>
  </div>
  <div class="section">
    <strong>What to watch:</strong>
    <p>{desc.visualization}</p>
  </div>
  <div class="section">
    <strong>Best used when:</strong>
    <p>{desc.when}</p>
  </div>
  <div class="section">
    <strong>Analogy:</strong>
    <p>{desc.analogy}</p>
  </div>
</div>

<style>
  .description {
    background: #1e293b;
    border-radius: 8px;
    padding: 1rem 1.5rem;
    border: 1px solid #334155;
  }

  h3 {
    margin: 0 0 0.75rem;
    color: #a78bfa;
    font-size: 1.1rem;
  }

  .section {
    margin-bottom: 0.5rem;
  }

  strong {
    color: #94a3b8;
    font-size: 0.8rem;
    text-transform: uppercase;
  }

  p {
    margin: 0.25rem 0 0;
    color: #e2e8f0;
    font-size: 0.9rem;
    line-height: 1.4;
  }
</style>
