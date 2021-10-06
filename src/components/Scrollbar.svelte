<script lang="ts">
  import Scrollbar from 'smooth-scrollbar';
  import type { ScrollbarOptions } from 'smooth-scrollbar/interfaces';
  import { onMount, onDestroy, afterUpdate, tick } from 'svelte';

  let container: HTMLDivElement;
  let scrollbar: Scrollbar;

  export let options: Partial<ScrollbarOptions> = {};

  export function getScrollbar() {
    return scrollbar;
  }

  onMount(() => {
    scrollbar = Scrollbar.init(container, {
      alwaysShowTracks: true,
      continuousScrolling: false,
      ...options,
    });
  });

  afterUpdate(async () => {
    // await DOM rendering to be finished
    await tick();
    scrollbar.update();
  });

  onDestroy(() => {
    scrollbar.destroy();
  });
</script>

<div bind:this={container} {...$$restProps}>
  <div class="scrollbar-wrapper">
    <slot></slot>
  </div>
</div>
