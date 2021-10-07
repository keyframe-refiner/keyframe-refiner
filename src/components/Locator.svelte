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

  let pressed = false;

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
        if (pressed) {
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
    pressed = true;

    pointerPosition.clientX = e.clientX;
    pointerPosition.clientY = e.clientY;

    update();
  }

  function onPointerUp() {
    pressed = false;
  }

  function onPointerMove(e: PointerEvent) {
    if (!pressed) {
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
  .locator {
    --locator-line-width: 2px;
    --locator-radius: 10px;
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
    top: 0;
    left: 0;
    width: calc(var(--locator-radius) * 2);
    height: calc(var(--locator-radius) * 2);
    border-radius: 50%;
    border: calc(var(--locator-line-width) * 1.5) solid var(--locator-color);
    transform: translate3d(calc(var(--locator-x) - 50%), calc(var(--locator-y) - 50%), 0);
    cursor: move;
  }

  .locator-line {
    position: absolute;
    top: 0;
    left: 0;

    &.horizontal {
      width: 100%;
      border-top: var(--locator-line-width) dashed var(--locator-color);
      transform: translate3d(0, calc(var(--locator-y) - 50%), 0);
    }

    &.vertical {
      height: 100%;
      border-right: var(--locator-line-width) dashed var(--locator-color);
      transform: translate3d(calc(var(--locator-x) - 50%), 0, 0);
    }
  }
</style>
