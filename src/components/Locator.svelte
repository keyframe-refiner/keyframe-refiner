<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { getContext, hasContext, onMount } from 'svelte';
  import type Scrollbar from 'smooth-scrollbar';

  import { defaultTransformer } from '../utils/coord-transformer';
  import { Point, Rect } from '../record-factory';

  export let point = new Point();

  export let limits = new Rect({
    x1: -Infinity,
    y1: -Infinity,
    x2: Infinity,
    y2: Infinity,
  });

  export let localToReal = defaultTransformer;
  export let realToLocal = defaultTransformer;

  let container: HTMLElement;

  $: localPoint = realToLocal(point);

  let moving = false;

  let pointerPosition = new Point({
    x: 0,
    y: 0,
  });

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

    const p = localToReal(new Point({
      x: clamp(pointerPosition.x - bounding.left, 0, bounding.width),
      y: clamp(pointerPosition.y - bounding.top, 0, bounding.height),
    }));

    point = new Point({
      x: clamp(p.x, limits.x1, limits.x2),
      y: clamp(p.y, limits.y1, limits.y2),
    });

    container.dispatchEvent(new CustomEvent('pan-move', {
      bubbles: true,
      detail: {
        pointerX: pointerPosition.x,
        pointerY: pointerPosition.y,
      },
    }));
  }

  function onPointerDown(e: PointerEvent) {
    moving = true;

    pointerPosition = new Point({
      x: e.clientX,
      y: e.clientY,
    });

    update();
  }

  function onPointerUp() {
    moving = false;
  }

  function onPointerMove(e: PointerEvent) {
    if (!moving) {
      return;
    }

    pointerPosition = new Point({
      x: e.clientX,
      y: e.clientY,
    });

    update();
  }
</script>

<div
  class="locator"
  bind:this={container}
  on:pointerdown={onPointerDown}
  style={`--locator-x: ${localPoint.x}px; --locator-y: ${localPoint.y}px`}
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
    animation: locator-spinner 0.5s steps(16) infinite;
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
