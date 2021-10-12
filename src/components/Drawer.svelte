<script lang="ts">
  import { afterUpdate, hasContext, getContext } from 'svelte';
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

  let drawerBodyEl: HTMLElement;

  let getScrollbar: () => Promise<Scrollbar>;

  if (hasContext('getScrollbar')) {
    getScrollbar = getContext('getScrollbar');
  }

  afterUpdate(async () => {
    drawerBodyEl.style.maxHeight = `${open ? drawerBodyEl.scrollHeight : 0}px`;

    if (tracker.stale() && highlight) {
      // scroll to drawer
      const s = await getScrollbar();
      s.scrollIntoView(drawerBodyEl);
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

  <article class="drawer-body" bind:this={drawerBodyEl}>
    <div class="drawer-body-wrapper">
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
