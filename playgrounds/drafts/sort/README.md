# Sort Explorer

Interactive visualization of sorting algorithms using **Svelte** and **D3.js**.

## Algorithms Included

| Algorithm | Best | Average | Worst | Space | Stable |
|-----------|------|---------|-------|-------|--------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ |
| Counting Sort | O(n + k) | O(n + k) | O(n + k) | O(k) | ✅ |
| Radix Sort | O(d·(n+k)) | O(d·(n+k)) | O(d·(n+k)) | O(n+k) | ✅ |
| Bucket Sort | O(n + k) | O(n + k) | O(n²) | O(n) | ✅ |
| Shell Sort | O(n log n) | O(n^1.3) | O(n²) | O(1) | ❌ |
| Tim Sort | O(n) | O(n log n) | O(n log n) | O(n) | ✅ |

## Setup

```bash
cd sort-explorer
npm install
npm run dev
```

## Stack

- **Svelte** — Reactive UI framework
- **D3.js** — Data-driven visualizations (scales, transitions, color)
- **Vite** — Build tool

## Features

- Step-by-step algorithm execution
- Adjustable speed and array size
- Color-coded operations (compare, swap, sorted)
- Side-by-side algorithm comparison
- Complexity visualization overlay
