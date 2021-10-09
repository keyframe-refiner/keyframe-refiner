<script lang="ts">
  import Portal from 'svelte-portal';
  import Dialog from '@smui/dialog/styled';

  export let open: boolean;
</script>

{#if open}
  <Portal target="#modal">
    <Dialog bind:open on:MDCDialog:closed {...$$restProps}>
      <slot></slot>
    </Dialog>
  </Portal>
{/if}
