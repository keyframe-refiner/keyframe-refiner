<script lang="ts">
  import { mdiImageMultiple, mdiGithub } from '@mdi/js';
  import { fade } from 'svelte/transition';

  import DnD from './components/DnD.svelte';
  import SVGIcon from './components/SVGIcon.svelte';
  import Track from './views/Track.svelte';
  import ImageViewer from './views/ImageViewer.svelte';
  import Settings from './views/Settings.svelte';
  import Property from './views/Property.svelte';
  import { selectedInput, stepManager, cvWorker } from './store';
  import { STEP, stepDescription } from './constants';
  import Stepper from './components/Stepper.svelte';

  const { allSteps, currentIndex, currentStep } = stepManager;

  let loadingWorker = true;
  let openSettings = false;

  $cvWorker.ready.then(() => {
    loadingWorker = false;
    openSettings = true;
  }).catch(e => {
    alert(e?.message || e);
  });
</script>

<main>
  {#if loadingWorker}
    <div id="loading-worker" in:fade out:fade>Web Worker を起動しています...</div>
  {/if}

  <header id="header">
    <h1 id="logo">原画位置合わせ</h1>

    <Stepper
      steps={$allSteps.map(s => stepDescription[s])}
      currentIndex={$currentIndex}
    />


    <span id="badge">
      <Settings open={openSettings} />
      <a id="github" href="https://github.com/textcunma/keyframe-refiner" target="_blank">
        <SVGIcon icon={mdiGithub} />
      </a>
    </span>
  </header>

  <article id="gallery">
    <aside id="track">
      <Track />
    </aside>

    <section id="image-viewer">
      {#if $selectedInput}
        <ImageViewer />
      {:else}
        <SVGIcon id="viewer-placeholder" title="表示できる画像がありません" icon={mdiImageMultiple} />
      {/if}
    </section>

    <aside id="property">
      <Property />
    </aside>
  </article>

  {#if $currentStep !== STEP.RUN_CV}
    <DnD />
  {/if}
</main>

<div id="modal"></div>

<style lang="scss">
  main {
    width: 100%;
    height: 100%;
  }

  #loading-worker {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    font-size: 32px;
    background-color: rgba(0, 0, 0, 0.75);
    z-index: 1024;
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
    margin-left: 10px;
    color: #d1c4e9;
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
