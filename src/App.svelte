<script lang="ts">
  import { mdiImageMultiple } from '@mdi/js';

  import DnD from './components/DnD.svelte';
  import SVGIcon from './components/SVGIcon.svelte';
  import Track from './views/Track.svelte';
  import ImageViewer from './views/ImageViewer.svelte';
  import Property from './views/Property.svelte';
  import { selectedImage } from './store';
</script>

<main>
  <header id="header">stepper...</header>

  <article id="gallery">
    <aside id="track">
      <Track />
    </aside>

    <section id="image-viewer">
      {#if $selectedImage}
        <ImageViewer />
      {:else}
        <SVGIcon id="viewer-placeholder" title="表示できる画像がありません" icon={mdiImageMultiple} />
      {/if}
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
    background: var(--background-dimmed);
  }

  #gallery {
    display: flex;
    height: 100%;
    padding-top: var(--header-height);
  }

  #track {
    border-right: 1px solid var(--background-dimmed);
  }

  #image-viewer {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  #property {
    flex: 0 0 300px;
    border-left: 1px solid var(--background-dimmed);

    :global {
      table {
        width: 100%;
        table-layout: fixed;
      }
    }
  }

  :global {
    #viewer-placeholder {
      width: 20%;
      height: 20%;
      color: var(--placeholder);
    }
  }
</style>
