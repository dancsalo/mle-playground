# Sorting Algorithms — Complete Reference

## Comparison-Based Sorts

---

### 1. Bubble Sort

**Idea:** Repeatedly swap adjacent elements that are out of order.

```
Pass 1: [5,3,8,1] → [3,5,1,8] (8 bubbles to end)
Pass 2: [3,5,1,8] → [3,1,5,8] (5 bubbles up)
Pass 3: [3,1,5,8] → [1,3,5,8] (3 bubbles up)
```

| Metric | Value |
|--------|-------|
| Best | O(n) — already sorted, with early termination |
| Average | O(n²) |
| Worst | O(n²) — reverse sorted |
| Space | O(1) |
| Stable | ✅ Yes |
| Adaptive | ✅ Yes (with flag optimization) |

**Visualization:** Bars swap in pairs, largest values "bubble" rightward. Sorted region grows from the right.

**Variants:**
- Cocktail Shaker Sort (bidirectional bubble sort)
- Comb Sort (uses gaps like Shell Sort)

---

### 2. Selection Sort

**Idea:** Find the minimum of the unsorted region, swap it into place.

```
[29, 10, 14, 37, 13]
 Find min=10 → swap with pos 0 → [10, 29, 14, 37, 13]
 Find min=13 → swap with pos 1 → [10, 13, 14, 37, 29]
 ...
```

| Metric | Value |
|--------|-------|
| Best | O(n²) |
| Average | O(n²) |
| Worst | O(n²) |
| Space | O(1) |
| Stable | ❌ No (swaps can disrupt order) |
| Adaptive | ❌ No |

**Visualization:** A "scanner" sweeps through unsorted region tracking the minimum. One swap per pass places element in final position. Sorted region grows from the left.

**Key insight:** Minimizes number of swaps (exactly n-1). Good when writes are expensive.

---

### 3. Insertion Sort

**Idea:** Take each element and insert it into the correct position in the already-sorted prefix.

```
[5, 2, 4, 6, 1, 3]
 ↑ sorted |  unsorted
 Take 2: insert before 5 → [2, 5, 4, 6, 1, 3]
 Take 4: insert between 2,5 → [2, 4, 5, 6, 1, 3]
 ...
```

| Metric | Value |
|--------|-------|
| Best | O(n) — already sorted |
| Average | O(n²) |
| Worst | O(n²) — reverse sorted |
| Space | O(1) |
| Stable | ✅ Yes |
| Adaptive | ✅ Yes |

**Visualization:** Current element highlighted; it slides left through sorted portion until it finds its position. Elements shift right to make room.

**Key insight:** Excellent for nearly-sorted data and small arrays. Used as base case in Tim Sort and intro-sort.

---

### 4. Merge Sort

**Idea:** Divide array in half recursively; merge sorted halves.

```
[38, 27, 43, 3, 9, 82, 10]
Split: [38,27,43,3] | [9,82,10]
Split: [38,27] [43,3] | [9,82] [10]
Split: [38][27] [43][3] | [9][82] [10]
Merge: [27,38] [3,43] | [9,82] [10]
Merge: [3,27,38,43] | [9,10,82]
Merge: [3,9,10,27,38,43,82]
```

| Metric | Value |
|--------|-------|
| Best | O(n log n) |
| Average | O(n log n) |
| Worst | O(n log n) |
| Space | O(n) |
| Stable | ✅ Yes |
| Adaptive | ❌ No (but natural merge sort is) |

**Visualization:** Array splits into halves (tree structure). Merging shows two pointers comparing and placing elements into merged region. Color the active merge region.

**Key insight:** Guaranteed O(n log n), stable, parallelizable. Preferred for linked lists (O(1) extra space). External sorting standard.

---

### 5. Quick Sort

**Idea:** Pick a pivot; partition array into elements < pivot and > pivot; recurse on partitions.

```
[10, 80, 30, 90, 40, 50, 70]  pivot=70
Partition: [10,30,40,50] [70] [80,90]
Recurse on each partition...
```

| Metric | Value |
|--------|-------|
| Best | O(n log n) |
| Average | O(n log n) |
| Worst | O(n²) — bad pivot choices |
| Space | O(log n) — stack depth |
| Stable | ❌ No |
| Adaptive | ❌ No |

**Visualization:** Pivot highlighted in purple. Partition pointer sweeps left→right, swapping elements less than pivot to the left side. After partition, pivot goes to final position (green). Recurse into sub-arrays.

**Key insight:** Fastest in practice for random data (good cache behavior). Randomized pivot avoids worst case. Intro-sort falls back to heap sort if recursion is too deep.

**Variants:**
- Lomuto partition (simpler, slightly slower)
- Hoare partition (fewer swaps)
- 3-way partition (handles duplicates)
- Dual-pivot (Java's Arrays.sort)

---

### 6. Heap Sort

**Idea:** Build a max-heap; repeatedly extract max to build sorted array from the end.

```
Build max-heap: [1,3,5,4,6,13,10,9,8,15,17]
→ Max-heap: [17,15,13,9,6,5,10,4,8,3,1]
Extract 17 → end. Heapify remaining.
Extract 15 → second-to-last. Heapify remaining.
...
```

| Metric | Value |
|--------|-------|
| Best | O(n log n) |
| Average | O(n log n) |
| Worst | O(n log n) |
| Space | O(1) |
| Stable | ❌ No |
| Adaptive | ❌ No |

**Visualization:** Two phases: (1) Build heap — swaps ripple through tree structure shown as array. (2) Extract — max moves to end (green), heap shrinks and re-heapifies.

**Key insight:** Guaranteed O(n log n) with O(1) space. No worst-case degradation like quicksort. Poor cache performance in practice.

---

### 7. Shell Sort

**Idea:** Generalize insertion sort with decreasing gap sequences. Sort elements that are `gap` positions apart.

```
Gap=5: sort elements [0,5,10,...], [1,6,11,...], etc.
Gap=3: sort elements [0,3,6,...], [1,4,7,...], etc.
Gap=1: standard insertion sort (but array is nearly sorted)
```

| Metric | Value |
|--------|-------|
| Best | O(n log n) — depends on gap sequence |
| Average | O(n^1.3) approximately |
| Worst | O(n²) — Shell's original gaps; O(n^(4/3)) with Sedgewick's |
| Space | O(1) |
| Stable | ❌ No |
| Adaptive | ✅ Partially |

**Visualization:** Show the gap value decreasing. Highlight pairs being compared at the current gap distance. As gap shrinks, comparisons become more local. Final pass (gap=1) is a fast insertion sort.

**Gap sequences:**
- Shell (N/2, N/4, ...): O(n²) worst
- Knuth (1, 4, 13, 40, ...): O(n^(3/2))
- Sedgewick: O(n^(4/3))
- Ciura (empirical): 1, 4, 10, 23, 57, 132, 301, 701

---

## Non-Comparison Sorts

---

### 8. Counting Sort

**Idea:** Count occurrences of each value; use cumulative counts to place elements directly.

```
Input: [4, 2, 2, 8, 3, 3, 1]
Count: idx 1→1, 2→2, 3→2, 4→1, 8→1
Cumulative: [0, 1, 3, 5, 6, 6, 6, 6, 7]
Place elements using cumulative positions.
```

| Metric | Value |
|--------|-------|
| Best | O(n + k) |
| Average | O(n + k) |
| Worst | O(n + k) |
| Space | O(k) where k = range of values |
| Stable | ✅ Yes |
| Adaptive | ❌ No |

**Visualization:** First phase: count array fills up (histogram). Second phase: elements placed in order from counts — array rebuilds left to right.

**Key insight:** Linear time! But only practical when k (range) is not much larger than n. Building block for Radix Sort.

---

### 9. Radix Sort

**Idea:** Sort by each digit position (LSD to MSD or MSD to LSD), using a stable sort (counting sort) at each level.

```
[170, 45, 75, 90, 802, 24, 2, 66]
By ones:  [170, 90, 802, 2, 24, 45, 75, 66]
By tens:  [802, 2, 24, 45, 66, 170, 75, 90]
By hund:  [2, 24, 45, 66, 75, 90, 170, 802]
```

| Metric | Value |
|--------|-------|
| Best | O(d × (n + k)) |
| Average | O(d × (n + k)) |
| Worst | O(d × (n + k)) |
| Space | O(n + k) |
| Stable | ✅ Yes |
| Adaptive | ❌ No |

*d = number of digits, k = base (usually 10)*

**Visualization:** Multiple complete passes through the array. Each pass sorts by one digit — show which digit is being examined. Array gets progressively more sorted.

**Key insight:** Can beat O(n log n) when d is small and fixed. Works for integers, strings, fixed-length keys. LSD variant is more common (simpler).

---

### 10. Bucket Sort

**Idea:** Distribute elements into buckets by range, sort each bucket, concatenate.

```
Input: [0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23, 0.68]
Bucket 0 [0.0-0.2): [0.17, 0.12]
Bucket 1 [0.2-0.4): [0.39, 0.26, 0.21, 0.23]
Bucket 2 [0.4-0.6): []
...
Sort each bucket, concatenate.
```

| Metric | Value |
|--------|-------|
| Best | O(n + k) — uniform distribution |
| Average | O(n + k) — uniform distribution |
| Worst | O(n²) — all elements in one bucket |
| Space | O(n + k) |
| Stable | ✅ Yes (if bucket sort is stable) |
| Adaptive | ❌ No |

**Visualization:** Elements fly into buckets (colored regions). Each bucket gets sorted internally. Then buckets are concatenated — the array fills in from left to right by bucket.

**Key insight:** Achieves linear time with uniform distribution. Number of buckets is tunable. Commonly used for floating-point numbers in [0,1).

---

### 11. Tim Sort

**Idea:** Hybrid of merge sort and insertion sort. Identifies natural "runs" (ascending or descending subsequences), extends short runs with insertion sort, then merges runs using an optimized merge.

```
[5, 2, 3, 8, 9, 1, 4, 7, 6]
Identify runs: [2,3,5,8,9], [1,4,7], [6]
(short runs extended to minimum run length via insertion sort)
Merge runs following merge strategy (maintains invariants)
```

| Metric | Value |
|--------|-------|
| Best | O(n) — already sorted |
| Average | O(n log n) |
| Worst | O(n log n) |
| Space | O(n) |
| Stable | ✅ Yes |
| Adaptive | ✅ Yes (exploits existing order) |

**Visualization:** Phase 1: identify/create sorted runs (highlight run boundaries). Phase 2: merges grow — show two runs being combined, merged region expanding.

**Key insight:** Default sort in Python (`sorted()`/`list.sort()`), Java (`Arrays.sort()` for objects), Android, Swift. Exploits real-world partially-sorted data. Minimum run size = 32-64.

**Optimizations:**
- Galloping mode for unbalanced merges
- Merge stack invariants (like Fibonacci-shaped)
- Binary insertion sort for small runs

---

## Hybrid / Advanced Sorts

---

### 12. Intro Sort (Introspective Sort)

**Idea:** Starts with quicksort, switches to heapsort if recursion depth exceeds O(log n), and uses insertion sort for small sub-arrays.

| Metric | Value |
|--------|-------|
| Best | O(n log n) |
| Average | O(n log n) |
| Worst | O(n log n) — guaranteed by heap sort fallback |
| Space | O(log n) |
| Stable | ❌ No |

**Key insight:** Default in C++ STL (`std::sort`). Combines best properties of three algorithms.

---

### 13. Tree Sort

**Idea:** Insert all elements into a BST, then perform in-order traversal.

| Metric | Value |
|--------|-------|
| Best | O(n log n) — balanced tree |
| Average | O(n log n) |
| Worst | O(n²) — degenerate tree |
| Space | O(n) |
| Stable | ✅ Yes (with careful implementation) |

**Visualization:** Show BST growing as elements are inserted. Then in-order traversal produces sorted output.

---

### 14. Patience Sort

**Idea:** Deal elements into piles (like patience/solitaire card game), then merge piles.

| Metric | Value |
|--------|-------|
| Best | O(n log n) |
| Average | O(n log n) |
| Worst | O(n log n) |
| Space | O(n) |
| Stable | ✅ Yes |

**Key insight:** Number of piles = length of longest increasing subsequence (LIS)!

---

## Algorithm Selection Guide

```
┌─────────────────────────────────────────────────────┐
│                 WHICH SORT TO USE?                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Small array (n < 50)?                              │
│  └─→ Insertion Sort                                 │
│                                                     │
│  Nearly sorted?                                     │
│  └─→ Insertion Sort or Tim Sort                     │
│                                                     │
│  Need guaranteed O(n log n)?                        │
│  ├─→ Need stable? → Merge Sort / Tim Sort           │
│  └─→ No space? → Heap Sort                          │
│                                                     │
│  General purpose (fastest average)?                 │
│  └─→ Quick Sort (randomized) / Intro Sort           │
│                                                     │
│  Integer keys with small range?                     │
│  └─→ Counting Sort or Radix Sort                    │
│                                                     │
│  Uniform float distribution?                        │
│  └─→ Bucket Sort                                    │
│                                                     │
│  Linked list?                                       │
│  └─→ Merge Sort                                     │
│                                                     │
│  External (data on disk)?                           │
│  └─→ External Merge Sort                            │
│                                                     │
│  Parallel?                                          │
│  └─→ Merge Sort / Bitonic Sort / Sample Sort        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Complexity Comparison Chart (for visualization)

```
n:        10    100    1,000   10,000   100,000
─────────────────────────────────────────────────
O(n):     10    100    1,000   10,000   100,000
O(n lg n): 33   664    9,966   132,877  1,660,964
O(n²):   100  10,000  1M      100M     10B
─────────────────────────────────────────────────
```

## Visual Patterns to Observe

| Pattern | What to look for |
|---------|-----------------|
| **Bubble** | Wave-like motion; large values cascade right |
| **Selection** | One element placed per pass; minimal movement |
| **Insertion** | Left side stays sorted; new element slides in |
| **Merge** | Divide into halves visible; merge is a zipper |
| **Quick** | Pivot creates partition boundary; recursive halving |
| **Heap** | Tree structure flattened; max extraction from root |
| **Shell** | Long-range swaps first; decreasing gap visible |
| **Counting** | Histogram phase; then sequential placement |
| **Radix** | Multiple full passes; digits determine order |
| **Bucket** | Distribute then gather; regional sorting |
| **Tim** | Natural runs preserved; merges grow larger |
