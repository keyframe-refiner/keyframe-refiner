import { List } from 'immutable';
import { Point, Rect } from './record-factory';
import { defaultSteps } from './step';
import { StepTracker } from './utils/step-tracker';

import { writable } from 'svelte/store';
import type { ImageCanvas } from './image-canvas';

export const inputList = writable(List<ImageCanvas>());
export const outputList = writable(List<ImageCanvas>());

export const selectedImage = writable<ImageCanvas | undefined>();
export const refImage = writable<ImageCanvas | undefined>();

export const pivotPoint = writable(new Point());

export const ROI = writable(new Rect({
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,
}));

export const currentStep = new StepTracker(defaultSteps);
