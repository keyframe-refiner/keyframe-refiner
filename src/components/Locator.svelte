<script lang="ts">
  import Draggable from './Draggable.svelte';

  export let x = 0;
  export let y = 0;
</script>

<div class="locator">
  <Draggable bind:x bind:y fullsize {...$$restProps}>
    <div class="locator-line horizontal"></div>
    <div class="locator-line vertical"></div>
    <div class="locator-circle"></div>
  </Draggable>
</div>

<style lang="scss">
  .locator {
    --locator-line-width: 2px;
    --locator-radius: 10px;
    --locator-color: #ff3e00;
  }

  .locator-circle {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(var(--locator-radius) * 2);
    height: calc(var(--locator-radius) * 2);
    border-radius: 50%;
    border: calc(var(--locator-line-width) * 1.5) solid var(--locator-color);
    transform: translate3d(calc(var(--draggable-x) - 50%), calc(var(--draggable-y) - 50%), 0);
    cursor: move;
  }

  .locator-line {
    position: absolute;
    top: 0;
    left: 0;

    &.horizontal {
      width: 100%;
      border-top: var(--locator-line-width) dashed var(--locator-color);
      transform: translate3d(0, calc(var(--draggable-y) - 50%), 0);
    }

    &.vertical {
      height: 100%;
      border-right: var(--locator-line-width) dashed var(--locator-color);
      transform: translate3d(calc(var(--draggable-x) - 50%), 0, 0);
    }
  }
</style>
