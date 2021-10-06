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

export const pivotPointViewer = writable({
  x: 0,
  y: 0,
});
export const pivotPointReal = derived(
  [pivotPointViewer, viewerScale],
  ([$pivotPointViewer, $viewerScale]) => mapCoord($pivotPointViewer, $viewerScale),
);

export const cropRectViewer = writable({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});
export const cropRectReal = derived(
  [cropRectViewer, viewerScale],
  ([$cropRectViewer, $viewerScale]) => mapCoord($cropRectViewer, $viewerScale),
);

function mapCoord<T>($src: T, $scale: number): T {
  const $res = {} as T;

  Object.keys($src).forEach(key => {
    $res[key] = Math.round($src[key] / $scale);
  });

  return $res;
}
