<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { createEventDispatcher } from 'svelte';

  export let x = 0;
  export let y = 0;
  export let fullsize = false;
  export let delegateTo: HTMLElement | null = null;

  let wrapperEl: HTMLElement;
  $: container = delegateTo || wrapperEl;

  let pollingID: number;

  let pressed = false;

  const pointerPosition = {
    clientX: 0,
    clientY: 0,
  };

  const dispatch = createEventDispatcher();

  function polling() {
    const bounding = container.getBoundingClientRect();

    x = clamp(pointerPosition.clientX - bounding.left, 0, bounding.width);
    y = clamp(pointerPosition.clientY - bounding.top, 0, bounding.height);

    dispatch('move', { x, y });

    pollingID = requestAnimationFrame(polling);
  }

  function onPointerDown(e: PointerEvent) {
    pressed = true;
    cancelAnimationFrame(pollingID);
    pollingID = requestAnimationFrame(polling);

    pointerPosition.clientX = e.clientX;
    pointerPosition.clientY = e.clientY;

    // HACK: enable scrollbar auto-scrolling
    container.dispatchEvent(new CustomEvent('dragstart', {
      bubbles: true,
    }));
  }

  function onPointerUp() {
    pressed = false;
    cancelAnimationFrame(pollingID);
  }

  function onPointerMove(e: PointerEvent) {
    if (!pressed) {
      return;
    }

    pointerPosition.clientX = e.clientX;
    pointerPosition.clientY = e.clientY;
  }
</script>

<div
  class="draggable"
  class:fullsize
  bind:this={container}
  on:pointerdown={onPointerDown}
  style={`--draggable-x: ${x}px; --draggable-y: ${y}px`}
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
