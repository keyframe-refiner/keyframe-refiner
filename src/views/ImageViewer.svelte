<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { onMount, afterUpdate, tick } from 'svelte';
  import IconButton from '@smui/icon-button/styled';
  import { mdiMagnifyMinusOutline, mdiMagnifyPlusOutline } from '@mdi/js';

  import Locator from '../components/Locator.svelte';
  import Scrollbar from '../components/Scrollbar.svelte';
  import SVGIcon from '../components/SVGIcon.svelte';
  import { selectedImage, viewerScale, pivotPointViewer } from '../store';
  import { VariableTracker } from '../utils/variable-tracker';

  const minScale = 0.01;
  const maxScale = 3;
  const stepRatio = 1.5;

  let scrollbar: Scrollbar;
  let viewerEl: HTMLElement;
  let canvas: HTMLCanvasElement;

  let viewerOffsetX = 0;
  let viewerOffsetY = 0;

  let displayWidth: number;
  let displayHeight: number;

  const tracker = new VariableTracker(() => [
    $selectedImage,
    canvas,
  ]);

  onMount(initScale);

  afterUpdate(() => {
    if (!$selectedImage) {
      return;
    }

    repaint();
    adjustViewerOffsets();
  });

  function initScale() {
    if (!$selectedImage) {
      return;
    }

    const maxWidth = viewerEl.clientWidth * 0.8;
    const maxHeight = viewerEl.clientHeight * 0.8;

    $viewerScale = Math.min(
      1,
      maxWidth / $selectedImage.width,
      maxHeight / $selectedImage.height,
    );
  }

  function repaint() {
    if (!tracker.stale()) {
      return;
    }

    const ctx = canvas.getContext('2d')!;

    canvas.width = $selectedImage.width;
    canvas.height = $selectedImage.height;

    ctx.drawImage(
      $selectedImage.canvas,
      0, 0, $selectedImage.width, $selectedImage.height,
      0, 0, $selectedImage.width, $selectedImage.height,
    );
  }

  function adjustViewerOffsets() {
    displayWidth = $selectedImage.width * $viewerScale;
    displayHeight = $selectedImage.height * $viewerScale;

    if (displayWidth < viewerEl.clientWidth) {
      viewerOffsetX = (viewerEl.clientWidth - displayWidth) / 2;
    } else {
      viewerOffsetX = 0;
    }

    if (displayHeight < viewerEl.clientHeight) {
      viewerOffsetY = (viewerEl.clientHeight - displayHeight) / 2;
    } else {
      viewerOffsetY = 0;
    }
  }

  async function zoomAt(level: number, clientX?: number, clientY?: number) {
    if (clientX === undefined || clientY === undefined) {
      clientX = viewerEl.clientWidth / 2;
      clientY = viewerEl.clientHeight / 2;
    }

    const viewerRect = viewerEl.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // calculate the distance between the pointer and the left-top cornor of the canvas
    const dx = clientX - canvasRect.left;
    const dy = clientY - canvasRect.top;

    // how much `scale` is scaled
    const n = level / $viewerScale;

    // update `scale`
    $viewerScale = clamp(level, minScale, maxScale);
    $pivotPointViewer.x = clamp($pivotPointViewer.x * n, 0, canvas.clientWidth);
    $pivotPointViewer.y = clamp($pivotPointViewer.y * n, 0, canvas.clientWidth);

    // await rendering
    await tick();

    // update scrollbar position
    // `dx * n` => the new distance between the scaled canvas and the pointer
    // `clientX - viewerRect.left` => the distance between the pointer and the left-top cornor of the viewer
    scrollbar.getScrollbar().setPosition(
      dx * n - (clientX - viewerRect.left),
      dy * n - (clientY - viewerRect.top),
    );
  }

  function zoomIn() {
    zoomAt($viewerScale * stepRatio);
  }

  function zoomOut() {
    zoomAt($viewerScale / stepRatio);
  }

  function wheelZoom(e: WheelEvent) {
    if (!e.ctrlKey) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    // deltaY > 0 => zoomIn, deltaY < 0 => zoomOut
    const delta = e.deltaY / -100;
    zoomAt($viewerScale + delta, e.clientX, e.clientY);
  }
</script>

<div class="viewer" on:wheel={wheelZoom} bind:this={viewerEl}>
  <Scrollbar options={{ damping: 1, plugins: { overscroll: false } }} bind:this={scrollbar}>
    <article
      class="viewer-body"
      style={`
        --viewer-scale: ${$viewerScale};
        --viewer-offset-x: ${viewerOffsetX}px;
        --viewer-offset-y: ${viewerOffsetY}px;
        --viewer-width: ${displayWidth}px;
        --viewer-height: ${displayHeight}px;`
      }
    >
      <div class="viewer-wrapper">
        <canvas class="viewer-canvas" bind:this={canvas}></canvas>
        <Locator bind:x={$pivotPointViewer.x} bind:y={$pivotPointViewer.y} />
      </div>

    </article>
  </Scrollbar>

  <footer class="viewer-zoom">
    <IconButton title="縮小" on:click={zoomOut} disabled={$viewerScale === minScale}>
      <SVGIcon icon={mdiMagnifyMinusOutline} />
    </IconButton>

    <IconButton title="拡大" on:click={zoomIn} disabled={$viewerScale === maxScale}>
      <SVGIcon icon={mdiMagnifyPlusOutline} />
    </IconButton>
  </footer>
</div>

<style lang="scss">
  .viewer {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    user-select: none;
  }

  .viewer-zoom {
    position: absolute;
    bottom: 10px;
    right: 10px;
    mix-blend-mode: difference;

    :global {
      button:hover {
        color: var(--mdc-theme-primary);
      }

      button:disabled {
        color: var(--placeholder);
      }
    }
  }

  .viewer-body {
    flex: 1;
    height: calc(100vh - var(--header-height));
  }

  .viewer-canvas {
    width: var(--viewer-width);
    height: var(--viewer-height);
  }

  .viewer-wrapper {
    display: inline-block;
    font-size: 0;
    transform: translate(var(--viewer-offset-x), var(--viewer-offset-y));
  }
</style>
