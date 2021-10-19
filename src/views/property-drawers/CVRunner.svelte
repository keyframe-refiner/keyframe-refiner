<script lang="ts">
  import { ZipWriter, BlobWriter, BlobReader } from '@zip.js/zip.js';
  import { hasContext, getContext } from 'svelte';
  import Button from '@smui/button/styled';
  import { fade } from 'svelte/transition';
  import type Scrollbar from 'smooth-scrollbar';

  import Drawer from '../../components/Drawer.svelte';
  import { ImageCanvas } from '../../utils/image-canvas';
  import { STEP } from '../../step';
  import {
    inputList,
    outputList,
    refImage,
    ROI,
    pivotPoint,
    cvWorker,
    stepManager,
  } from '../../store';

  const { currentStep } = stepManager;
  const targetStep = STEP.RUN_CV;
  let progress = 0;
  let cvRunning = false;
  let creatingZip = false;

  let getScrollbar: () => Promise<Scrollbar>;

  if (hasContext('getScrollbar')) {
    getScrollbar = getContext('getScrollbar');
  }

  // reset progress when step changed
  currentStep.subscribe(() => {
    progress = 0;
  });

  async function runCV() {
    if (!$refImage) {
      return;
    }

    cvRunning = true;
    progress = 0;

    await $cvWorker.requestProcessing([...$inputList], $refImage, $ROI, $pivotPoint, (idx, res, prg) => {
      $outputList = $outputList.set(idx, res);
      progress = prg;
    });

    // scroll to bottom
    const s = await getScrollbar();
    s.setMomentum(0, s.limit.y - s.scrollTop);

    progress = 1;
    cvRunning = false;
  }

  async function download() {
    creatingZip = true;

    const zipWriter = new ZipWriter(new BlobWriter('application/zip'));

    for (const res of $outputList) {
      if (res instanceof ImageCanvas) {
        await zipWriter.add(
          res.filename,
          new BlobReader(await res.toBlob()),
        );
      }
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(await zipWriter.close());
    link.download = 'results.zip';
    link.click();

    creatingZip = false;
  }
</script>

<Drawer highlight={$currentStep === targetStep}>
  <span slot="title">OpenCV 処理</span>

  <div slot="body">
    <Button
      variant="unelevated"
      class="drawer-button"
      disabled={$currentStep !== targetStep || cvRunning || progress === 1}
      on:click={runCV}
    >
      {cvRunning ? '処理中...' : 'CV 処理開始'}
    </Button>

    <Button
      variant="unelevated"
      class="drawer-button download"
      style={`--progress: ${progress * 100}%`}
      disabled={progress !== 1}
      on:click={download}
    >
      {creatingZip ? 'zip ファイル生成中...' : 'ダウンロード'}
      {#if cvRunning}
        <span class="progress" in:fade out:fade>{Math.floor(progress * 100)}%</span>
      {/if}
    </Button>
  </div>
</Drawer>

<style lang="scss">
  :global(.download) {
    position: relative;
    overflow: hidden;
  }

  .progress {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: var(--progress);
    height: 100%;
    color: var(--mdc-theme-surface);
    background-color: var(--mdc-theme-primary);
    font-size: 12px;
    overflow: hidden;
  }
</style>
