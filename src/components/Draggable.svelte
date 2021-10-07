<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { getContext, hasContext, onMount } from 'svelte';
  import type Scrollbar from 'smooth-scrollbar';

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

  let [localX, localY] = realXYtoLocalXY(x, y); // init values

  // auto update
  $: [localX, localY] = realXYtoLocalXY(x, y);

  let wrapperEl: HTMLElement;
  $: container = delegateTo || wrapperEl;

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
    [x, y] = localXYtoRealXY(lx, ly);
  }

  function onPointerDown(e: PointerEvent) {
    pressed = true;

    pointerPosition.clientX = e.clientX;
    pointerPosition.clientY = e.clientY;

    update();

    // HACK: enable scrollbar auto-scrolling
    container.dispatchEvent(new CustomEvent('dragstart', {
      bubbles: true,
    }));
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
