<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { getContext, hasContext, onMount } from 'svelte';
  import type Scrollbar from 'smooth-scrollbar';

  import { defaultTransformer } from '../utils/coord-transformer';

  export let point = {
    x: 0,
    y: 0,
  };

  export let limits = {
    x1: -Infinity,
    y1: -Infinity,
    x2: Infinity,
    y2: Infinity,
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

    // calibrate position
    update();
  });

  function update() {
    const bounding = container.getBoundingClientRect();

    const [px, py] = localXYtoRealXY(
      clamp(pointerPosition.clientX - bounding.left, 0, bounding.width),
      clamp(pointerPosition.clientY - bounding.top, 0, bounding.height),
    );

    point.x = clamp(px, limits.x1, limits.x2);
    point.y = clamp(py, limits.y1, limits.y2);

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
  <svg class="locator-line horizontal">
    <line x1="0" y1="0" x2="100%" y2="0" />
  </svg>
  <svg class="locator-line vertical">
    <line x1="0" y1="0" x2="0" y2="100%" />
  </svg>
  <svg class="locator-circle">
    <circle cx="50%" cy="50%" style="r: calc(var(--locator-radius) - var(--locator-line-width))" />
  </svg>
</div>

<svelte:window
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:blur={onPointerUp}
/>

<style lang="scss">
  @keyframes locator-spinner {
    to {
      stroke-dashoffset: -16;
    }
  }

  .locator {
    --locator-line-width: 2px;
    --locator-radius: 15px;
    --locator-color: var(--mdc-theme-secondary);

    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    user-select: none;
  }

  .locator-circle,
  .locator-line {
    stroke-dasharray: 8 8;
    fill: none;
    stroke: var(--locator-color);
    animation: locator-spinner 0.5s linear infinite;
  }

  .locator-circle {
    position: absolute;
    width: calc(var(--locator-radius) * 2);
    height: calc(var(--locator-radius) * 2);
    cursor: move;
    stroke-width: calc(var(--locator-line-width) * 1.5);
    transform: translate3d(calc(var(--locator-x) - 50%), calc(var(--locator-y) - 50%), 0);
  }

  .locator-line {
    position: absolute;
    top: 0;
    left: 0;
    fill: none;
    stroke-width: 100%;

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
