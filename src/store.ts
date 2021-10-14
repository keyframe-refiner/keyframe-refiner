import { List } from 'immutable';
import { Point, Rect } from './record-factory';
import { defaultSteps } from './step';
import { StepManager } from './utils/step-manager';
import { CVWorker } from './cv-worker';

import { writable } from 'svelte/store';
import type { ImageCanvas } from './image-canvas';

export const inputList = writable(List<ImageCanvas>());
export const outputList = writable(List<ImageCanvas | Error>());

export const selectedImage = writable<ImageCanvas | undefined>();
export const refImage = writable<ImageCanvas | undefined>();

export const pivotPoint = writable(new Point());

export const ROI = writable(new Rect({
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,
}));

export const stepManager = new StepManager(defaultSteps);

export const cvWorker = writable(
  new CVWorker('/worker/align.js', 4),
);

// states
export const calculatingPivot = writable(false);
export const showROI = writable(false);
export const showPivot = writable(false);
export const showRefImage = writable(false);
export const cvRunning = writable(false);
