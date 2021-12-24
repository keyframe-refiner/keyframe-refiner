<script lang="ts">
  import { fade } from 'svelte/transition';
  import {
    mdiImageMultiple,
  } from '@mdi/js';
  import { GoogleAnalytics } from '@beyonk/svelte-google-analytics';

  import DnD from './components/DnD.svelte';
  import SVGIcon from './components/SVGIcon.svelte';
  import Track from './views/Track.svelte';
  import ImageViewer from './views/ImageViewer.svelte';
  import Settings from './views/Settings.svelte';
  import Property from './views/Property.svelte';
  import Stepper from './components/Stepper.svelte';
  import { STEP, stepDescription } from './constants';
  import {
    selectedInput,
    stepManager,
    cvWorker,
  } from './store';

  const version = __VERSION__;
  const { allSteps, currentIndex, currentStep } = stepManager;

  let loadingWorker = true;
  let openModeDialog = false;

  $cvWorker.ready.then(() => {
    loadingWorker = false;
    openModeDialog = true;
  }).catch(e => {
    alert(e?.message || e);
  });
</script>

<main>
  {#if loadingWorker}
    <div id="loading-worker" in:fade out:fade>Web Worker を起動しています...</div>
  {/if}

  <header id="header">
    <h1 id="logo">
      Keyframe Refiner
      <span id="version">v{version}</span>
    </h1>

    <Stepper
      steps={$allSteps.map(s => stepDescription[s])}
      currentIndex={$currentIndex}
    />

    <div id="controls">
      <Settings openDialog={openModeDialog} />
    </div>
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

<GoogleAnalytics properties={['G-N11KZ2H6B9']} />

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
    display: flex;
    flex-direction: column;
    font-size: 20px;
    padding-left: 10px;
  }

  #version {
    font-size: xx-small;
    color: var(--placeholder-light);
  }

  #controls {
    flex: 1;
    padding-right: 10px;
    text-align: right;
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
