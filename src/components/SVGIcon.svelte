<script lang="ts">
  import Svg from '@smui/common/Svg.svelte';
  import { Icon } from '@smui/common/styled';

  export let icon: string;
</script>

<span {...$$restProps}>
  <Icon component={Svg} viewBox="0 0 24 24">
    <path fill="currentColor" d={icon} />
  </Icon>
</span>

<style lang="scss">
  span {
    width: 24px;
    height: 24px;
    user-select: none;

    :global {
      svg {
        width: inherit;
        height: inherit;
      }

      svg:focus {
        outline: none;
      }
    }
  }
</style>
