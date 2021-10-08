<script lang="ts">
  import debounce from 'lodash-es/debounce';
  import { afterUpdate } from 'svelte';

  import { VariableTracker } from '../utils/variable-tracker';
  import type { ImageCanvas } from '../image-canvas';

  export let image: ImageCanvas;

  let wrapper: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  let wrapperWidth: number;
  let wrapperHeight: number;

  const tracker = new VariableTracker(() => [
    image, canvas, wrapperWidth, wrapperHeight,
  ]);

  const scaleSteps = 3;

  const oc = document.createElement('canvas');

  function resize(scale: number) {
    const ctx = canvas.getContext('2d')!;
    const octx = oc.getContext('2d')!;

    ctx.imageSmoothingEnabled = octx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = octx.imageSmoothingQuality = 'high';

    let dw = image.width;
    let dh = image.height;
    let src = image.canvas;

    if (scale < 1) {
      // down-stepping, see: https://stackoverflow.com/a/19262385/2369823
      const ratio = Math.pow(scale, 1 / scaleSteps);

      oc.width = src.width;
      oc.height = src.height;

      for (let i = 0; i < scaleSteps; i++) {
        const sw = dw;
        const sh = dh;
        dw *= ratio;
        dh *= ratio;

        octx.drawImage(
          src,
          0, 0, sw, sh,
          0, 0, dw, dh,
        );

        src = oc;
      }
    }

    // paint
    const sw = dw;
    const sh = dh;
    dw = image.width * scale;
    dh = image.height * scale;

    canvas.width = dw;
    canvas.height = dh;

    ctx.drawImage(
      src,
      0, 0, sw, sh,
      0, 0, dw, dh,
    );
  }

  async function repaint() {
    if (!canvas || !image) {
      return;
    }

    // all unchanged => no repaint needed
    if (!tracker.stale()) {
      return;
    }

    wrapperWidth = wrapper.clientWidth;
    wrapperHeight = wrapper.clientHeight;

    const scale = Math.min(
      1,
      wrapperWidth / image.width,
      wrapperHeight / image.height,
    );

    resize(scale);
  }

  afterUpdate(repaint);
</script>

<div class="preview-wrapper" bind:this={wrapper} {...$$restProps}>
  <canvas bind:this={canvas}></canvas>
  <slot></slot>
</div>

<svelte:window on:resize={debounce(repaint, 300)} />

<style lang="scss">
  .preview-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  canvas {
    max-width: 100%;
    max-height: 100%;
  }
</style>
