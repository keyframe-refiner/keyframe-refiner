<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import debounce from 'lodash-es/debounce';
  import { afterUpdate } from 'svelte';
  import IconButton from '@smui/icon-button/styled';
  import { mdiMagnifyMinusOutline, mdiMagnifyPlusOutline } from '@mdi/js';

  import Locator from '../components/Locator.svelte';
  import Cropper from '../components/Cropper.svelte';
  import Scrollbar from '../components/Scrollbar.svelte';
  import SVGIcon from '../components/SVGIcon.svelte';
  import { selectedImage, pivotPoint, ROI, stepManager, calculatingPivot, refImage, showPivot, showROI } from '../store';
  import { STEP } from '../step';
  import { VariableTracker } from '../utils/variable-tracker';
  import { Point } from '../record-factory';

  const { currentStep } = stepManager;

  let scale = 0;
  const minScale = 0.01;
  const maxScale = 3;
  const stepRatio = 1.25;

  let scrollbar: Scrollbar;
  let viewerEl: HTMLElement;
  let imgEl: HTMLImageElement;

  let viewerOffsetX = 0;
  let viewerOffsetY = 0;

  let displayWidth: number;
  let displayHeight: number;

  $: notRefImage = $refImage && $refImage !== $selectedImage;

  const selectedImageTracker = new VariableTracker(() => [
    $selectedImage,
  ]);

  const scaleTracker = new VariableTracker(() => [
    scale,
  ]);

  afterUpdate(() => {
    if (!$selectedImage || !viewerEl) {
      return;
    }

    if (selectedImageTracker.stale()) {
      resetScale();
    }

    if (scaleTracker.stale()) {
      // scale changed => force locator and cropper to update
      $pivotPoint = $pivotPoint.clone();
      $ROI = $ROI.clone();
    }

    adjustViewerOffsets();
  });

  function resetScale() {
    if (!$selectedImage) {
      return;
    }

    const maxWidth = viewerEl.clientWidth * 0.8;
    const maxHeight = viewerEl.clientHeight * 0.8;

    scale = Math.min(
      1,
      maxWidth / $selectedImage.width,
      maxHeight / $selectedImage.height,
    );
  }

  function adjustViewerOffsets() {
    if (!$selectedImage) {
      return;
    }

    displayWidth = Math.round($selectedImage.width * scale);
    displayHeight = Math.round($selectedImage.height * scale);

    if (displayWidth < viewerEl.clientWidth) {
      viewerOffsetX = Math.round((viewerEl.clientWidth - displayWidth) / 2);
    } else {
      viewerOffsetX = 0;
    }

    if (displayHeight < viewerEl.clientHeight) {
      viewerOffsetY = Math.round((viewerEl.clientHeight - displayHeight) / 2);
    } else {
      viewerOffsetY = 0;
    }
  }

  async function zoomAt(level: number, clientX?: number, clientY?: number) {
    if (clientX === undefined || clientY === undefined) {
      clientX = viewerEl.clientWidth / 2;
      clientY = viewerEl.clientHeight / 2;
    }

    // memoize previous scale value
    const prevScale = scale;

    // update `scale`
    scale = clamp(level, minScale, maxScale);

    // how much `scale` is scaled
    const n = scale / prevScale;

    // update scrollbar position
    const s = await scrollbar.getScrollbar();

    s.update();

    const viewerRect = viewerEl.getBoundingClientRect();
    const imgRect = imgEl.getBoundingClientRect();

    // calculate the distance between the pointer and the left-top cornor of the canvas
    const dx = clientX - imgRect.left;
    const dy = clientY - imgRect.top;

    // `dx * n` => the new distance between the scaled canvas and the pointer
    // `clientX - viewerRect.left` => the distance between the pointer and the left-top cornor of the viewer
    s.setPosition(
      dx * n - (clientX - viewerRect.left),
      dy * n - (clientY - viewerRect.top),
    );
  }

  function zoomIn() {
    zoomAt(scale * stepRatio);
  }

  function zoomOut() {
    zoomAt(scale / stepRatio);
  }

  function wheelZoom(e: WheelEvent) {
    if (!e.ctrlKey) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    // deltaY > 0 => zoomIn, deltaY < 0 => zoomOut
    const delta = e.deltaY / -100;
    zoomAt(scale + delta, e.clientX, e.clientY);
  }

  function localToReal(p: Point) {
    return new Point({
      x: Math.round(p.x / scale),
      y: Math.round(p.y / scale),
    });
  }

  function realToLocal(p: Point) {
    return new Point({
      x: Math.round(p.x * scale),
      y: Math.round(p.y * scale),
    });
  }
</script>

<div class="viewer" on:wheel={wheelZoom} bind:this={viewerEl}>
  {#if $calculatingPivot}
    <div class="viewer-fullsize-cover message">基準位置を自動算出中...</div>
  {/if}

  <Scrollbar options={{ damping: 1, plugins: { overscroll: false } }} bind:this={scrollbar}>
    <article
      class="viewer-body"
      style={`
        --viewer-scale: ${scale};
        --viewer-offset-x: ${viewerOffsetX}px;
        --viewer-offset-y: ${viewerOffsetY}px;
        --viewer-width: ${displayWidth}px;
        --viewer-height: ${displayHeight}px;`
      }
    >
      <img
          class="viewer-image"
          class:dimmed={false}
          src={$selectedImage?.blobURL}
          alt={$selectedImage?.filename}
          bind:this={imgEl}
          on:mousedown|preventDefault
      />

      {#if $currentStep === STEP.SET_ROI}
        <Cropper bind:cropRect={$ROI} {localToReal} {realToLocal}/>
      {/if}

      {#if $showROI}
        <Cropper bind:cropRect={$ROI} {localToReal} {realToLocal} readonly />
      {/if}

      {#if $currentStep === STEP.SET_PIVOT}
        <Locator bind:point={$pivotPoint} limits={$ROI} {localToReal} {realToLocal}/>
      {/if}

      {#if $showPivot}
        <Locator bind:point={$pivotPoint} limits={$ROI} {localToReal} {realToLocal} readonly />
      {/if}
    </article>
  </Scrollbar>

  <footer class="viewer-zoom">
    <IconButton title="縮小" on:pointerdown={zoomOut} disabled={scale === minScale}>
      <SVGIcon icon={mdiMagnifyMinusOutline} />
    </IconButton>

    <IconButton title="拡大" on:pointerdown={zoomIn} disabled={scale === maxScale}>
      <SVGIcon icon={mdiMagnifyPlusOutline} />
    </IconButton>
  </footer>
</div>

<svelte:window on:resize={debounce(adjustViewerOffsets, 100)} />

<style lang="scss">
  .viewer {
    position: relative;
    width: 100%;
    height: 100%;
    user-select: none;

    :global(.scrollbar) {
      height: 100%;
    }
  }

  .viewer-fullsize-cover {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.75);
    font-size: 32px;
    z-index: 1024;
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
    position: relative;
    display: inline-flex;
    width: var(--viewer-width);
    height: var(--viewer-height);
    transform: translate3d(var(--viewer-offset-x), var(--viewer-offset-y), 0);
  }

  .viewer-image {
    position: absolute;
    top: 0;
    left: 0;
    transform: scale3d(var(--viewer-scale), var(--viewer-scale), 1);
    transform-origin: 0 0;

    &.dimmed {
      opacity: var(--dimmed-image-opacity);
    }
  }
</style>
