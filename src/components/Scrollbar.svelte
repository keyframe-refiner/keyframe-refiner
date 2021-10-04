<script lang="ts">
  import Scrollbar from 'smooth-scrollbar';
  import { onMount, onDestroy, afterUpdate } from 'svelte';

  let container: HTMLDivElement;
  let scrollbar: Scrollbar;

  export function getScrollbar() {
    return scrollbar;
  }

  onMount(() => {
    scrollbar = Scrollbar.init(container, {
      alwaysShowTracks: true,
    });
  });

  afterUpdate(() => {
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
