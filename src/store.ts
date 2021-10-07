import { writable, derived } from 'svelte/store';
import type { ImageCanvas } from './image-canvas';

export const inputList = writable<ImageCanvas[]>([]);
export const outputList = writable<ImageCanvas[]>([]);

export const selectedIndex = writable(0);
export const selectedImage = derived(
  [selectedIndex, inputList],
  ([$selectedIndex, $inputList]) => $inputList[$selectedIndex],
);

export const viewerScale = writable(0);

export const pivotPoint = writable({
  x: 0,
  y: 0,
});

export const ROI = writable({
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,
});
