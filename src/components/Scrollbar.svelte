<script lang="ts">
  import Scrollbar from 'smooth-scrollbar';
  import type { ScrollbarOptions } from 'smooth-scrollbar/interfaces';
  import { onMount, onDestroy, afterUpdate, tick, setContext } from 'svelte';

  import { Defer } from '../utils/defer';

  let container: HTMLDivElement;
  let scrollbar: Scrollbar;
  let observer: ResizeObserver | undefined;

  const supportResizeObserver = typeof ResizeObserver === 'function';
  const defer = new Defer<Scrollbar>();

  export let options: Partial<ScrollbarOptions> = {};

  export function getScrollbar() {
    return defer.promise;
  }

  setContext('getScrollbar', getScrollbar);

  onMount(() => {
    scrollbar = Scrollbar.init(container, {
      alwaysShowTracks: true,
      continuousScrolling: false,
      ...options,
    });

    defer.resolve(scrollbar);

    if (supportResizeObserver) {
      observer = new ResizeObserver(() => {
        scrollbar.update();
      });

      observer.observe(scrollbar.contentEl);
    }
  });

  if (!supportResizeObserver) {
    afterUpdate(async () => {
      // await DOM rendering to be finished
      await tick();
      scrollbar.update();
    });
  }

  onDestroy(() => {
    scrollbar.destroy();
    observer?.disconnect();
  });
</script>

<div class="scrollbar" bind:this={container} {...$$restProps}>
  <div class="scrollbar-wrapper">
    <slot></slot>
  </div>
</div>
