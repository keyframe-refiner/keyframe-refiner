<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { getContext, hasContext, onMount } from 'svelte';
  import type Scrollbar from 'smooth-scrollbar';

  import { defaultTransformer } from '../utils/coord-transformer';

  export let point = {
    x: 0,
    y: 0,
  };

  export let localXYtoRealXY = defaultTransformer;
  export let realXYtoLocalXY = defaultTransformer;

  let container: HTMLElement;

  $: [localX, localY] = realXYtoLocalXY(point.x, point.y);

  let moving = false;

  const pointerPosition = {
    clientX: 0,
    clientY: 0,
  };

  let getScrollbar: () => Promise<Scrollbar>;

  if (hasContext('getScrollbar')) {
    getScrollbar = getContext('getScrollbar');
  }

  onMount(async () => {
    if (getScrollbar) {
      const scrollbar = await getScrollbar();

      scrollbar.addListener(() => {
        if (moving) {
          update();
        }
      });
    }
  });

  function update() {
    const bounding = container.getBoundingClientRect();

    // assign new values to localX, localY may cause unnecessary component updates
    // therefore, use local variables instead
    const lx = clamp(pointerPosition.clientX - bounding.left, 0, bounding.width);
    const ly = clamp(pointerPosition.clientY - bounding.top, 0, bounding.height);

    // manually update x, y => component updates => auto update localX, localY (subscription)
    [point.x, point.y] = localXYtoRealXY(lx, ly);

    // HACK: enable scrollbar auto-scrolling
    container.dispatchEvent(new CustomEvent('pan-move', {
      bubbles: true,
      detail: {
        pointerX: pointerPosition.clientX,
        pointerY: pointerPosition.clientY,
      },
    }));
  }

  function onPointerDown(e: PointerEvent) {
    moving = true;

    pointerPosition.clientX = e.clientX;
    pointerPosition.clientY = e.clientY;

    update();
  }

  function onPointerUp() {
    moving = false;
  }

  function onPointerMove(e: PointerEvent) {
    if (!moving) {
      return;
    }

    pointerPosition.clientX = e.clientX;
    pointerPosition.clientY = e.clientY;

    update();
  }
</script>

<div
  class="locator"
  bind:this={container}
  on:pointerdown={onPointerDown}
  style={`--locator-x: ${localX}px; --locator-y: ${localY}px`}
>
  <div class="locator-line horizontal"></div>
  <div class="locator-line vertical"></div>
  <div class="locator-circle"></div>
</div>

<svelte:window
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:blur={onPointerUp}
/>

<style lang="scss">
  @keyframes locator-line-spinner {
    to {
      background-position: 10px 0, 0 10px;
    }
  }

  @keyframes locator-circle-spinner {
    to {
      transform: rotateZ(360deg);
    }
  }

  .locator {
    --locator-line-width: 2px;
    --locator-radius: 12px;
    --locator-color: var(--mdc-theme-secondary);

    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    user-select: none;
  }

  .locator-circle {
    position: absolute;
    top: var(--locator-y);
    left: var(--locator-x);
    width: calc(var(--locator-radius) * 2);
    height: calc(var(--locator-radius) * 2);
    margin-top: calc(var(--locator-radius) * -1);
    margin-left: calc(var(--locator-radius) * -1);
    border-radius: 50%;
    border: calc(var(--locator-line-width) * 1.5) dashed var(--locator-color);
    cursor: move;
    animation: locator-circle-spinner 5s linear infinite;
  }

  .locator-line {
    position: absolute;
    top: 0;
    left: 0;
    background: linear-gradient(90deg, var(--locator-color) 50%, transparent 50%),
              linear-gradient(0deg, var(--locator-color) 50%, transparent 50%);
    background-size: 10px var(--locator-line-width), var(--locator-line-width) 10px;
    background-repeat: repeat-x, repeat-y;
    background-position: 0 0, 0 0;
    animation: locator-line-spinner 0.5s linear infinite;

    &.horizontal {
      width: 100%;
      height: var(--locator-line-width);
      transform: translate3d(0, calc(var(--locator-y) - 50%), 0);
    }

    &.vertical {
      height: 100%;
      width: var(--locator-line-width);
      transform: translate3d(calc(var(--locator-x) - 50%), 0, 0);
    }
  }
</style>
