import { List } from 'immutable';
import { Point, Rect } from './record-factory';

import { writable, derived } from 'svelte/store';
import type { ImageCanvas } from './image-canvas';

export const inputList = writable(List<ImageCanvas>());
export const outputList = writable(List<ImageCanvas>());

export const selectedIndex = writable(0);
export const selectedImage = derived(
  [selectedIndex, inputList],
  ([$selectedIndex, $inputList]) => $inputList.get($selectedIndex),
);

export const pivotPoint = writable(new Point());

export const ROI = writable(new Rect({
  x1: 400,
  y1: 400,
  x2: 1000,
  y2: 1000,
}));
