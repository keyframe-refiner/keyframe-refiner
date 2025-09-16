import { List } from 'immutable';
import { Point, Rect } from './utils/record-factory';
import { defaultSteps, MODE } from './constants';
import { StepManager } from './utils/step-manager';
import { CVWorker } from './utils/cv-worker';

import { writable, derived } from 'svelte/store';
import type { ImageCanvas } from './utils/image-canvas';
import { MIMETYPE } from '../shared/mimetype';

export const debugMode = writable(__DEV_MODE__);

export const inputList = writable(List<ImageCanvas>());
export const outputList = writable(List<ImageCanvas | Error>());

export const selectedIndex = writable(0);
export const selectedInput = derived(
  [inputList, selectedIndex],
  ([$inputList, $selectedIndex]) => $inputList.get($selectedIndex),
);
export const selectedOutput = derived(
  [outputList, selectedIndex],
  ([$outputList, $selectedIndex]) => $outputList.get($selectedIndex),
);

export const detectMode = writable(localStorage.getItem('keyframe-refiner-detect-mode') as MODE || MODE.PEG_HOLE);
export const filenameTemplate = writable(localStorage.getItem('keyframe-refiner-filename-template') || '{filename}_out');
export const outputMIME = writable(localStorage.getItem('keyframe-refiner-output-mime') as MIMETYPE || MIMETYPE.AS_IS);

detectMode.subscribe(mode => {
  localStorage.setItem('keyframe-refiner-detect-mode', mode);
});

filenameTemplate.subscribe(template => {
  localStorage.setItem('keyframe-refiner-filename-template', template);
});

outputMIME.subscribe(mime => {
  localStorage.setItem('keyframe-refiner-output-mime', mime);
});

export const fitFrame = writable(false);

export const refImage = writable<ImageCanvas | undefined>();

export const pivotPoint = writable(new Point());

export const ROI = writable(new Rect());

export const stepManager = new StepManager(defaultSteps);

export const cvWorker = writable(new CVWorker());

// states
export const calculatingPivot = writable(false);
export const showROI = writable(false);
export const showPivot = writable(false);
export const showRefImage = writable(false);
export const showInputImage = writable(false);
