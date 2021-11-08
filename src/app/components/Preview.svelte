<script lang="ts">
  import { afterUpdate } from 'svelte';

  import { VariableTracker } from '../utils/variable-tracker';
  import type { ImageCanvas } from '../utils/image-canvas';

  export let image: ImageCanvas | undefined;

  let canvas: HTMLCanvasElement;

  const tracker = new VariableTracker(() => [
    image,
  ]);

  async function repaint() {
    if (!canvas || !image) {
      return;
    }

    // all unchanged => no repaint needed
    if (!tracker.stale()) {
      return;
    }

    const ctx = canvas.getContext('2d')!;

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(
      image.canvas,
      0, 0, image.width, image.height,
      0, 0, image.width, image.height,
    );
  }

  afterUpdate(repaint);
</script>

<canvas bind:this={canvas} title={image?.filename}></canvas>
