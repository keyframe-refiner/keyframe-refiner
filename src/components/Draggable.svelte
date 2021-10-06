<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { beforeUpdate } from 'svelte';

  interface CoordTransformer {
    (x: number, y: number): [number, number],
  }

  function defaultTransformer(x: number, y: number): [number, number] {
    return [x, y];
  }

  export let x = 0;
  export let y = 0;
  export let fullsize = false;
  export let delegateTo: HTMLElement | null = null;
  export let localXYtoRealXY: CoordTransformer = defaultTransformer;
  export let realXYtoLocalXY: CoordTransformer = defaultTransformer;

  let [localX, localY] = realXYtoLocalXY(x, y);

  beforeUpdate(() => {
    [localX, localY] = realXYtoLocalXY(x, y);
    // console.log('update', x, y, localX, localY);
  });

  let wrapperEl: HTMLElement;
  $: container = delegateTo || wrapperEl;

  let pollingID: number;

  let pressed = false;
  let pointerMoved = false;

  const pointerPosition = {
    clientX: 0,
    clientY: 0,
  };

  function polling() {
    if (pointerMoved) {
      const bounding = container.getBoundingClientRect();

      localX = clamp(pointerPosition.clientX - bounding.left, 0, bounding.width);
      localY = clamp(pointerPosition.clientY - bounding.top, 0, bounding.height);

      [x, y] = localXYtoRealXY(localX, localY);

      pointerMoved = false;
    }

    pollingID = requestAnimationFrame(polling);
  }

  function onPointerDown(e: PointerEvent) {
    pointerMoved = pressed = true;
    cancelAnimationFrame(pollingID);

    pointerPosition.clientX = e.clientX;
    pointerPosition.clientY = e.clientY;

    polling();

    // HACK: enable scrollbar auto-scrolling
    container.dispatchEvent(new CustomEvent('dragstart', {
      bubbles: true,
    }));
  }

  function onPointerUp() {
    pointerMoved = pressed = false;
    cancelAnimationFrame(pollingID);
  }

  function onPointerMove(e: PointerEvent) {
    if (!pressed) {
      return;
    }

    pointerMoved = true;
    pointerPosition.clientX = e.clientX;
    pointerPosition.clientY = e.clientY;
  }
</script>

<div
  class="draggable"
  class:fullsize
  bind:this={container}
  on:pointerdown={onPointerDown}
  style={`--draggable-x: ${localX}px; --draggable-y: ${localY}px`}
>
  <slot />
</div>

<svelte:window
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:blur={onPointerUp}
/>

<style lang="scss">
  .draggable {
    user-select: none;

    &.fullsize {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      user-select: none;
    }
  }
</style>
