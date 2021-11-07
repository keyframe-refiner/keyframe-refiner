import type { ImageCanvas } from './image-canvas';
import { STEP } from '../constants';

export type ImageState = {
  image?: ImageCanvas,
  dimmed?: boolean,
  processing?: boolean,
  error?: string,
};

export function getImageState(
  input: ImageCanvas | undefined,
  output: ImageCanvas | Error | undefined,
  refImage: ImageCanvas | undefined,
  currentStep: STEP,
): ImageState {
  let image: ImageCanvas | undefined;
  let dimmed: boolean | undefined;
  let processing: boolean | undefined;
  let error: string | undefined;

  if (currentStep === STEP.RUN_CV) {
    if (!output) {
      image = input;
      processing = true;
      dimmed = true;
    } else if (output instanceof Error) {
      image = input;
      error = output.message;
      dimmed = true;
    } else {
      image = output;
      dimmed = false;
    }
  } else {
    image = input;
    dimmed = !!refImage && image !== refImage;
  }

  return {
    image,
    error,
    dimmed,
    processing,
  };
}
