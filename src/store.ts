import { writable, derived } from 'svelte/store';
import type { ImageCanvas } from './image-canvas';

export const inputList = writable<ImageCanvas[]>([]);
export const outputList = writable<ImageCanvas[]>([]);

export const selectedIndex = writable(0);
export const selectedImage = derived(
  [selectedIndex, inputList],
  ([$selectedIndex, $inputList]) => $inputList[$selectedIndex],
);
