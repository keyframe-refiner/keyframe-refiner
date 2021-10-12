<script lang="ts">
  import { mdiImageMultiple, mdiGithub } from '@mdi/js';

  import DnD from './components/DnD.svelte';
  import SVGIcon from './components/SVGIcon.svelte';
  import Track from './views/Track.svelte';
  import ImageViewer from './views/ImageViewer.svelte';
  import Property from './views/Property.svelte';
  import { selectedImage, currentStep } from './store';
  import { stepDescription } from './step';
  import Stepper from './components/Stepper.svelte';
</script>

<main>
  <header id="header">
    <h1 id="logo">原画位置合わせ</h1>

    <Stepper
      steps={$currentStep && currentStep.getAllSteps().map(s => stepDescription[s])}
      currentIndex={$currentStep && currentStep.getIndex()}
    /> <!-- force reactivity -->

    <span id="badge">
      <a id="github" href="https://github.com/textcunma/genga-mapping" target="_blank">
        <SVGIcon icon={mdiGithub} />
      </a>
    </span>
  </header>

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

<div id="modal"></div>

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
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: var(--header-height);
    background: var(--background-dimmed);

    :global(.stepper) {
      flex: 2;
    }
  }

  #logo {
    flex: 1;
    font-size: 24px;
    padding-left: 10px;
    user-select: none;
  }

  #badge {
    flex: 1;
    padding-right: 10px;
    text-align: right;
  }

  #github {
    display: inline-block;
    width: 32px;
    height: 32px;
    color: var(--placeholder-surface);
    cursor: pointer;
    transition: transform .3s easeOutBack;

    &:hover {
      transform: scale(1.1);
    }
  }

  #gallery {
    display: flex;
    height: 100%;
    padding-top: var(--header-height);
  }

  #track {
    border-right: 2px solid var(--background-dimmed);
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
    width: 300px;
    border-left: 2px solid var(--background-dimmed);

    :global {
      .scrollbar {
        height: calc(100vh - var(--header-height));
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
