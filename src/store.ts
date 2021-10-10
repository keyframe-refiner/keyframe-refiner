import { List } from 'immutable';
import { Point, Rect } from './record-factory';

import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { ImageCanvas } from './image-canvas';

export const inputList = writable(List<ImageCanvas>());
export const outputList = writable(List<ImageCanvas>());

export const selectedImage: Writable<ImageCanvas | undefined> = writable();

export const pivotPoint = writable(new Point());

export const ROI = writable(new Rect({
  x1: 400,
  y1: 400,
  x2: 1000,
  y2: 1000,
}));
