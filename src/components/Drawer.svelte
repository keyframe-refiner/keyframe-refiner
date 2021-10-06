<script lang="ts">
  export let open = true;
</script>

<section {...$$restProps}>
  {#if $$slots.header}
    <header>
      <slot name="header"></slot>
    </header>
  {/if}

  <article style={`max-width: ${open ? 'none' : '0'}`}>
    <slot name="body"></slot>
  </article>
</section>

<style lang="scss">
  header {
    font-weight: bold;
    font-size: 1.1em;
    padding: 1em 0;
  }
</style>
