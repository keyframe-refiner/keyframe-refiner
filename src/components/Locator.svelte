<script lang="ts">
  import Pannable from './Pannable.svelte';

  export let x = 0;
  export let y = 0;
</script>

<div class="locator">
  <Pannable bind:x bind:y overlay {...$$restProps}>
    <div class="locator-line horizontal"></div>
    <div class="locator-line vertical"></div>
    <div class="locator-circle"></div>
  </Pannable>
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
    transform: translate3d(calc(var(--pannable-x) - 50%), calc(var(--pannable-y) - 50%), 0);
    cursor: move;
  }

  .locator-line {
    position: absolute;
    top: 0;
    left: 0;

    &.horizontal {
      width: 100%;
      border-top: var(--locator-line-width) dashed var(--locator-color);
      transform: translate3d(0, calc(var(--pannable-y) - 50%), 0);
    }

    &.vertical {
      height: 100%;
      border-right: var(--locator-line-width) dashed var(--locator-color);
      transform: translate3d(calc(var(--pannable-x) - 50%), 0, 0);
    }
  }
</style>
