<script lang="ts">
  import { onMount } from 'svelte';

  import { selectedImage } from '../store';
  import type { ImageCanvas } from '../image-canvas';

  let canvas: HTMLCanvasElement;
  let lastPainted: ImageCanvas | null;

  function draw() {
    if (!canvas || lastPainted === $selectedImage) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if ($selectedImage) {
      canvas.width = $selectedImage.width;
      canvas.height = $selectedImage.height;
      ctx?.drawImage($selectedImage.canvas, 0, 0);

      lastPainted = $selectedImage;
    } else {
      canvas.width = canvas.height = 0;
      lastPainted = null;
    }
  }

  onMount(draw);
  selectedImage.subscribe(draw);
</script>

<div class="viewer">
  <canvas bind:this={canvas}></canvas>
</div>

<style lang="scss">
  .viewer {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  canvas {
    max-width: 80%;
    max-height: 80%;
  }
</style>
