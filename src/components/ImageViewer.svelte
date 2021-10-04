<script lang="ts">
  import { onMount } from 'svelte';
  import debounce from 'lodash-es/debounce';

  import { selectedImage } from '../store';

  let canvas: HTMLCanvasElement;

  function draw() {
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if ($selectedImage) {
      canvas.width = $selectedImage.width;
      canvas.height = $selectedImage.height;

      ctx?.drawImage($selectedImage.canvas, 0, 0);
    } else {
      canvas.width = canvas.height = 0;
    }
  }

  onMount(draw);
  selectedImage.subscribe(debounce(draw, 300));
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
