<script lang="ts">
  import DnD from './components/DnD.svelte';
  import Track from './views/Track.svelte';
  import ImageViewer from './views/ImageViewer.svelte';
  import Property from './views/Property.svelte';
</script>

<main>
  <header id="header">stepper...</header>

  <article id="gallery">
    <aside id="track">
      <Track />
    </aside>

    <section id="image-viewer">
      <ImageViewer />
    </section>

    <aside id="property">
      <Property />
    </aside>
  </article>

  <DnD />
</main>

<style lang="scss">
  main {
    width: 100%;
    height: 100%;
  }

  #header {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    width: 100%;
    height: var(--header-height);
    background: #13191f;
  }

  #gallery {
    display: flex;
    height: 100%;
    padding-top: var(--header-height);
  }

  #track {
    border-right: 1px solid var(--seperator-color);
  }

  #image-viewer {
    position: relative;
    flex: 1;
  }

  #property {
    flex: 0 0 300px;
    border-left: 1px solid var(--seperator-color);

    :global {
      table {
        width: 100%;
        table-layout: fixed;
      }
    }
  }
</style>
