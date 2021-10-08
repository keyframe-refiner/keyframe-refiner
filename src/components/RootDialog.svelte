<script lang="ts">
  import Portal from 'svelte-portal';
  import Dialog from '@smui/dialog/styled';

  export let open: boolean;
</script>

<Portal target="body">
  <Dialog bind:open on:MDCDialog:closed {...$$restProps}>
    <slot></slot>
  </Dialog>
</Portal>
