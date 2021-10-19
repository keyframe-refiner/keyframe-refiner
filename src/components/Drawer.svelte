<script lang="ts">
  import { onMount, onDestroy, afterUpdate, hasContext, getContext } from 'svelte';
  import { mdiChevronRight } from '@mdi/js';
  import type Scrollbar from 'smooth-scrollbar';
  import SVGIcon from './SVGIcon.svelte';
  import { VariableTracker } from '../utils/variable-tracker';

  export let open = true;
  export let freeze = false;
  export let highlight = false;

  const tracker = new VariableTracker(() => [
    highlight,
  ]);

  let drawerBodyWrapper: HTMLElement;
  let observer : ResizeObserver | undefined;
  let contentHeight: number;

  let getScrollbar: () => Promise<Scrollbar>;

  if (hasContext('getScrollbar')) {
    getScrollbar = getContext('getScrollbar');
  }

  onMount(() => {
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(() => {
        contentHeight = drawerBodyWrapper.scrollHeight;
      });

      observer.observe(drawerBodyWrapper);
    }
  });

  onDestroy(() => {
    observer?.disconnect();
  });

  afterUpdate(async () => {
    if (tracker.stale() && highlight) {
      // scroll to drawer
      const s = await getScrollbar();
      s.scrollIntoView(drawerBodyWrapper);
    }
  });

  function toggle() {
    if (freeze) {
      return;
    }

    open = !open;
  }
</script>

<section class="drawer" class:open class:freeze class:highlight>
  <header class="drawer-header" on:click={toggle}>
    {#if !freeze}
      <span class="drawer-toggle">
        <SVGIcon icon={mdiChevronRight} />
      </span>
    {/if}

    <slot name="title"></slot>
  </header>

  <article
    class="drawer-body"
    style={`max-height: ${open ? contentHeight : 0}px`}
  >
    <div class="drawer-body-wrapper" bind:this={drawerBodyWrapper}>
      <slot name="body"></slot>
    </div>
  </article>
</section>

<style lang="scss">
  .drawer {
    --drawer-highlight-color: var(--mdc-theme-primary);

    position: relative;
    display: flex;
    flex-direction: column;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 3px solid var(--drawer-highlight-color);
      opacity: 0;
      transition: opacity .3s;
      pointer-events: none;
      box-sizing: border-box;
    }

    &.open {
      .drawer-toggle{
        transform: rotateZ(90deg);
      }
    }

    &.freeze {
      .drawer-header {
        cursor: default;
      }
    }

    &.highlight {
      &::before {
        opacity: 1;
      }

      .drawer-header {
        color: var(--surface);
        background-color: var(--drawer-highlight-color);
      }
    }
  }

  .drawer-header {
    display: flex;
    align-items: center;
    font-size: 1.1em;
    padding: 5px 10px;
    background: var(--placeholder);
    color: var(--surface-dimmed);
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid var(--background-dimmed);
    transition: all .3s;
  }

  .drawer-toggle {
    width: 24px;
    height: 24px;
    margin-right: 3px;
    transition: transform .3s;
  }

  .drawer-body {
    overflow: hidden;
    transition: max-height .3s;
  }

  .drawer-body-wrapper {
    padding: 10px;
  }
</style>
