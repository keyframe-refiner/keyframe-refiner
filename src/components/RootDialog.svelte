<script lang="ts">
  import Portal from 'svelte-portal';
  import Dialog from '@smui/dialog/styled';
  import { createEventDispatcher } from 'svelte';

  export let open: boolean;

  let show = open;
  $: show = open || show;

  const dispatch = createEventDispatcher();

  function onClose() {
    open = show = false;
    dispatch('closed');
  }
</script>

{#if show}
  <Portal target="body">
    <Dialog {open} on:MDCDialog:closed={onClose} {...$$restProps}>
      <slot></slot>
    </Dialog>
  </Portal>
{/if}
