<script lang="ts">
  import type { List } from 'immutable';
  export let steps: List<string>;
  export let currentIndex: number;
</script>

<nav class="stepper">
  {#each [...steps] as step, i (step)}
    <div class="step" class:active={i <= currentIndex}>
      <span class="step-indicator">{i + 1}</span>
      <span class="step-description">{step}</span>
    </div>
  {/each}
</nav>

<style lang="scss">
  .stepper {
    --step-indicator-size: 30px;

    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    font-size: 14px;
    cursor: default;
  }

  .step {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;

    &:not(:first-child)::before {
      content: '';
      position: absolute;
      top: calc(var(--step-indicator-size) / 2);
      right: calc(50% + var(--step-indicator-size) / 2);
      width: 100%;
      height: 1px;
      background: var(--placeholder);
      transition: background .3s;
      z-index: 1;
    }

    &.active {
      .step-indicator,
      &:not(:first-child)::before {
        background: var(--mdc-theme-primary);
      }
    }
  }

  .step-indicator {
    position: relative;
    width: var(--step-indicator-size);
    height: var(--step-indicator-size);
    background: var(--placeholder);
    text-align: center;
    line-height: var(--step-indicator-size);
    border-radius: 50%;
    z-index: 2;
    transition: background .3s;
  }

  .step-description {
    margin-top: 5px;
    text-align: center;
    white-space: nowrap;
  }
</style>
