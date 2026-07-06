// All sorting algorithm generators that yield visualization steps
// Each step: { type, indices, array }

export function* bubbleSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { type: 'compare', indices: [j, j + 1], array: [...a], sorted: Array.from({ length: i }, (_, k) => n - 1 - k) };
      if (a[j].value > a[j + 1].value) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        yield { type: 'swap', indices: [j, j + 1], array: [...a], sorted: Array.from({ length: i }, (_, k) => n - 1 - k) };
      }
    }
    yield { type: 'sorted', indices: [n - 1 - i], array: [...a], sorted: Array.from({ length: i + 1 }, (_, k) => n - 1 - k) };
  }
  yield { type: 'done', indices: [], array: [...a], sorted: Array.from({ length: n }, (_, k) => k) };
}

export function* selectionSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;
  const sorted = [];

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { type: 'compare', indices: [minIdx, j], array: [...a], sorted: [...sorted], active: [i] };
      if (a[j].value < a[minIdx].value) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      yield { type: 'swap', indices: [i, minIdx], array: [...a], sorted: [...sorted] };
    }
    sorted.push(i);
    yield { type: 'sorted', indices: [i], array: [...a], sorted: [...sorted] };
  }
  sorted.push(n - 1);
  yield { type: 'done', indices: [], array: [...a], sorted: [...sorted] };
}

export function* insertionSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;

  for (let i = 1; i < n; i++) {
    let j = i;
    yield { type: 'compare', indices: [j - 1, j], array: [...a], sorted: [], active: [i] };
    while (j > 0 && a[j - 1].value > a[j].value) {
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      yield { type: 'swap', indices: [j - 1, j], array: [...a], sorted: [] };
      j--;
      if (j > 0) {
        yield { type: 'compare', indices: [j - 1, j], array: [...a], sorted: [] };
      }
    }
  }
  yield { type: 'done', indices: [], array: [...a], sorted: Array.from({ length: n }, (_, k) => k) };
}

export function* mergeSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;

  function* mergeSortHelper(lo, hi) {
    if (hi - lo <= 1) return;
    const mid = Math.floor((lo + hi) / 2);
    yield* mergeSortHelper(lo, mid);
    yield* mergeSortHelper(mid, hi);
    yield* merge(lo, mid, hi);
  }

  function* merge(lo, mid, hi) {
    const left = a.slice(lo, mid);
    const right = a.slice(mid, hi);
    let i = 0, j = 0, k = lo;

    while (i < left.length && j < right.length) {
      yield { type: 'compare', indices: [lo + i, mid + j], array: [...a], sorted: [], active: Array.from({ length: hi - lo }, (_, idx) => lo + idx) };
      if (left[i].value <= right[j].value) {
        a[k] = left[i];
        i++;
      } else {
        a[k] = right[j];
        j++;
      }
      yield { type: 'overwrite', indices: [k], array: [...a], sorted: [] };
      k++;
    }
    while (i < left.length) {
      a[k] = left[i];
      yield { type: 'overwrite', indices: [k], array: [...a], sorted: [] };
      i++; k++;
    }
    while (j < right.length) {
      a[k] = right[j];
      yield { type: 'overwrite', indices: [k], array: [...a], sorted: [] };
      j++; k++;
    }
  }

  yield* mergeSortHelper(0, n);
  yield { type: 'done', indices: [], array: [...a], sorted: Array.from({ length: n }, (_, k) => k) };
}

export function* quickSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;
  const sorted = [];

  function* quickSortHelper(lo, hi) {
    if (lo >= hi) {
      if (lo === hi) sorted.push(lo);
      return;
    }
    const pivotIdx = yield* partition(lo, hi);
    sorted.push(pivotIdx);
    yield { type: 'sorted', indices: [pivotIdx], array: [...a], sorted: [...sorted], pivot: pivotIdx };
    yield* quickSortHelper(lo, pivotIdx - 1);
    yield* quickSortHelper(pivotIdx + 1, hi);
  }

  function* partition(lo, hi) {
    const pivot = a[hi].value;
    yield { type: 'pivot', indices: [hi], array: [...a], sorted: [...sorted], pivot: hi };
    let i = lo;
    for (let j = lo; j < hi; j++) {
      yield { type: 'compare', indices: [j, hi], array: [...a], sorted: [...sorted], pivot: hi };
      if (a[j].value < pivot) {
        [a[i], a[j]] = [a[j], a[i]];
        yield { type: 'swap', indices: [i, j], array: [...a], sorted: [...sorted], pivot: hi };
        i++;
      }
    }
    [a[i], a[hi]] = [a[hi], a[i]];
    yield { type: 'swap', indices: [i, hi], array: [...a], sorted: [...sorted] };
    return i;
  }

  yield* quickSortHelper(0, n - 1);
  yield { type: 'done', indices: [], array: [...a], sorted: Array.from({ length: n }, (_, k) => k) };
}

export function* heapSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;
  const sorted = [];

  function* heapify(size, i) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < size) {
      yield { type: 'compare', indices: [largest, left], array: [...a], sorted: [...sorted] };
      if (a[left].value > a[largest].value) largest = left;
    }
    if (right < size) {
      yield { type: 'compare', indices: [largest, right], array: [...a], sorted: [...sorted] };
      if (a[right].value > a[largest].value) largest = right;
    }
    if (largest !== i) {
      [a[i], a[largest]] = [a[largest], a[i]];
      yield { type: 'swap', indices: [i, largest], array: [...a], sorted: [...sorted] };
      yield* heapify(size, largest);
    }
  }

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(n, i);
  }

  // Extract elements
  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    yield { type: 'swap', indices: [0, i], array: [...a], sorted: [...sorted] };
    sorted.push(i);
    yield { type: 'sorted', indices: [i], array: [...a], sorted: [...sorted] };
    yield* heapify(i, 0);
  }
  sorted.push(0);
  yield { type: 'done', indices: [], array: [...a], sorted: [...sorted] };
}

export function* shellSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;

  let gap = Math.floor(n / 2);
  while (gap > 0) {
    for (let i = gap; i < n; i++) {
      let j = i;
      yield { type: 'compare', indices: [j - gap, j], array: [...a], sorted: [], active: [i] };
      while (j >= gap && a[j - gap].value > a[j].value) {
        [a[j - gap], a[j]] = [a[j], a[j - gap]];
        yield { type: 'swap', indices: [j - gap, j], array: [...a], sorted: [] };
        j -= gap;
        if (j >= gap) {
          yield { type: 'compare', indices: [j - gap, j], array: [...a], sorted: [] };
        }
      }
    }
    gap = Math.floor(gap / 2);
  }
  yield { type: 'done', indices: [], array: [...a], sorted: Array.from({ length: n }, (_, k) => k) };
}

export function* countingSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;
  const max = Math.max(...a.map(x => x.value));
  const count = new Array(max + 1).fill(0);

  // Count occurrences
  for (let i = 0; i < n; i++) {
    count[a[i].value]++;
    yield { type: 'compare', indices: [i], array: [...a], sorted: [] };
  }

  // Rebuild array
  let idx = 0;
  for (let val = 0; val <= max; val++) {
    while (count[val] > 0) {
      a[idx] = { value: val, id: idx };
      yield { type: 'overwrite', indices: [idx], array: [...a], sorted: Array.from({ length: idx }, (_, k) => k) };
      idx++;
      count[val]--;
    }
  }
  yield { type: 'done', indices: [], array: [...a], sorted: Array.from({ length: n }, (_, k) => k) };
}

export function* radixSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;
  const max = Math.max(...a.map(x => x.value));
  let exp = 1;

  while (Math.floor(max / exp) > 0) {
    const output = new Array(n);
    const count = new Array(10).fill(0);

    for (let i = 0; i < n; i++) {
      const digit = Math.floor(a[i].value / exp) % 10;
      count[digit]++;
      yield { type: 'compare', indices: [i], array: [...a], sorted: [] };
    }

    for (let i = 1; i < 10; i++) count[i] += count[i - 1];

    for (let i = n - 1; i >= 0; i--) {
      const digit = Math.floor(a[i].value / exp) % 10;
      output[count[digit] - 1] = a[i];
      count[digit]--;
    }

    for (let i = 0; i < n; i++) {
      a[i] = output[i];
      yield { type: 'overwrite', indices: [i], array: [...a], sorted: [] };
    }
    exp *= 10;
  }
  yield { type: 'done', indices: [], array: [...a], sorted: Array.from({ length: n }, (_, k) => k) };
}

export function* bucketSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;
  const max = Math.max(...a.map(x => x.value));
  const bucketCount = Math.ceil(Math.sqrt(n));
  const buckets = Array.from({ length: bucketCount }, () => []);

  // Distribute into buckets
  for (let i = 0; i < n; i++) {
    const bucketIdx = Math.floor((a[i].value / (max + 1)) * bucketCount);
    buckets[bucketIdx].push(a[i]);
    yield { type: 'compare', indices: [i], array: [...a], sorted: [] };
  }

  // Sort each bucket (insertion sort) and reconstruct
  let idx = 0;
  for (const bucket of buckets) {
    bucket.sort((x, y) => x.value - y.value);
    for (const item of bucket) {
      a[idx] = item;
      yield { type: 'overwrite', indices: [idx], array: [...a], sorted: Array.from({ length: idx }, (_, k) => k) };
      idx++;
    }
  }
  yield { type: 'done', indices: [], array: [...a], sorted: Array.from({ length: n }, (_, k) => k) };
}

export function* timSort(arr) {
  const a = arr.map(x => ({ ...x }));
  const n = a.length;
  const RUN = Math.min(32, n);

  // Insertion sort on runs
  for (let start = 0; start < n; start += RUN) {
    const end = Math.min(start + RUN, n);
    for (let i = start + 1; i < end; i++) {
      let j = i;
      while (j > start && a[j - 1].value > a[j].value) {
        yield { type: 'compare', indices: [j - 1, j], array: [...a], sorted: [] };
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        yield { type: 'swap', indices: [j - 1, j], array: [...a], sorted: [] };
        j--;
      }
    }
  }

  // Merge runs
  for (let size = RUN; size < n; size *= 2) {
    for (let lo = 0; lo < n; lo += 2 * size) {
      const mid = Math.min(lo + size, n);
      const hi = Math.min(lo + 2 * size, n);
      if (mid < hi) {
        const left = a.slice(lo, mid);
        const right = a.slice(mid, hi);
        let i = 0, j = 0, k = lo;
        while (i < left.length && j < right.length) {
          yield { type: 'compare', indices: [lo + i, mid + j], array: [...a], sorted: [] };
          if (left[i].value <= right[j].value) {
            a[k] = left[i++];
          } else {
            a[k] = right[j++];
          }
          yield { type: 'overwrite', indices: [k], array: [...a], sorted: [] };
          k++;
        }
        while (i < left.length) { a[k] = left[i++]; yield { type: 'overwrite', indices: [k], array: [...a], sorted: [] }; k++; }
        while (j < right.length) { a[k] = right[j++]; yield { type: 'overwrite', indices: [k], array: [...a], sorted: [] }; k++; }
      }
    }
  }
  yield { type: 'done', indices: [], array: [...a], sorted: Array.from({ length: n }, (_, k) => k) };
}

// Registry of all algorithms
export const algorithms = {
  bubble: { name: 'Bubble Sort', fn: bubbleSort, best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
  selection: { name: 'Selection Sort', fn: selectionSort, best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false },
  insertion: { name: 'Insertion Sort', fn: insertionSort, best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
  merge: { name: 'Merge Sort', fn: mergeSort, best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true },
  quick: { name: 'Quick Sort', fn: quickSort, best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: false },
  heap: { name: 'Heap Sort', fn: heapSort, best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: false },
  shell: { name: 'Shell Sort', fn: shellSort, best: 'O(n log n)', avg: 'O(n^1.3)', worst: 'O(n²)', space: 'O(1)', stable: false },
  counting: { name: 'Counting Sort', fn: countingSort, best: 'O(n+k)', avg: 'O(n+k)', worst: 'O(n+k)', space: 'O(k)', stable: true },
  radix: { name: 'Radix Sort', fn: radixSort, best: 'O(d(n+k))', avg: 'O(d(n+k))', worst: 'O(d(n+k))', space: 'O(n+k)', stable: true },
  bucket: { name: 'Bucket Sort', fn: bucketSort, best: 'O(n+k)', avg: 'O(n+k)', worst: 'O(n²)', space: 'O(n)', stable: true },
  tim: { name: 'Tim Sort', fn: timSort, best: 'O(n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true },
};
