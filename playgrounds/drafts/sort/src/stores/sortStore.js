import { writable, derived } from 'svelte/store';

export const arraySize = writable(30);
export const speed = writable(50); // ms per step
export const selectedAlgorithm = writable('bubble');
export const isRunning = writable(false);
export const isPaused = writable(false);
export const comparisons = writable(0);
export const swaps = writable(0);
export const currentStep = writable(0);

// Array state with metadata for visualization
export const arrayState = writable([]);

// Highlighted indices for visualization
export const highlights = writable({
  comparing: [],   // indices being compared (yellow)
  swapping: [],    // indices being swapped (red)
  sorted: [],      // indices in final position (green)
  pivot: null,     // pivot index (purple)
  active: [],      // currently active region (blue)
});

export function resetStats() {
  comparisons.set(0);
  swaps.set(0);
  currentStep.set(0);
  highlights.set({ comparing: [], swapping: [], sorted: [], pivot: null, active: [] });
}

export function generateArray(size) {
  const arr = Array.from({ length: size }, (_, i) => ({
    value: Math.floor(Math.random() * 100) + 1,
    id: i,
  }));
  arrayState.set(arr);
  resetStats();
  return arr;
}
