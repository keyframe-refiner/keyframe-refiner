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

  function repaint() {
    if (!canvas || !image) {
      return;
    }

    // all unchanged => no repaint needed
    if (!tracker.stale()) {
      return;
    }

    wrapperWidth = wrapper.clientWidth;
    wrapperHeight = wrapper.clientHeight;

    const ctx = canvas.getContext('2d');
    let dw = image.width;
    let dh = image.height;

    const scale = Math.max(
      image.width / wrapperWidth,
      image.height / wrapperHeight,
    );

    if (scale > 1) {
      dw /= scale;
      dh /= scale;
    }

    canvas.width = dw;
    canvas.height = dh;

    ctx?.drawImage(
      image.canvas,
      0, 0, image.width, image.height,
      0, 0, dw, dh,
    );
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
</style>
