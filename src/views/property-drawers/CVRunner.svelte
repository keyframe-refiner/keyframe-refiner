<script lang="ts">
  import pAll from 'p-all';
  import { ZipWriter, BlobWriter, BlobReader } from '@zip.js/zip.js';
  import { mdiPackageDown, mdiSpaceInvaders } from '@mdi/js';
  import Portal from 'svelte-portal';
  import Fab from '@smui/fab/styled';
  import Button from '@smui/button/styled';
  import CircularProgress from '@smui/circular-progress/styled';

  import Drawer from '../../components/Drawer.svelte';
  import SVGIcon from '../../components/SVGIcon.svelte';
  import { ImageCanvas } from '../../utils/image-canvas';
  import { STEP } from '../../constants';
  import {
    inputList,
    outputList,
    refImage,
    ROI,
    pivotPoint,
    cvWorker,
    stepManager,
    detectMode,
  } from '../../store';

  const { currentStep } = stepManager;
  const targetStep = STEP.RUN_CV;
  let progress = 0;
  let cvRunning = false;
  let creatingZip = false;

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

    await $cvWorker.requestProcessing(
      $detectMode, [...$inputList], $refImage, $ROI, $pivotPoint,
      (idx, res, prg) => {
        $outputList = $outputList.set(idx, res);
        progress = prg;
      },
    );

    progress = 1;
    cvRunning = false;
  }

  async function download() {
    creatingZip = true;

    const zipWriter = new ZipWriter(new BlobWriter('application/zip'));

    const actions = [...$outputList]
      .filter(res => res instanceof ImageCanvas)
      .map((image: ImageCanvas) => async () => zipWriter.add(
        image.filename,
        new BlobReader(await image.toBlob()),
        { bufferedWrite: true },
      ));

    // HACK: image.toBlob() is a time-consuming task and will freeze the UI for seconds,
    // so wait for UI updating here...
    await new Promise(resolve => setTimeout(resolve));

    await pAll(actions, {
      concurrency: navigator.hardwareConcurrency || 4,
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(await zipWriter.close());
    link.download = 'results.zip';
    link.click();

    creatingZip = false;
  }
</script>

<Drawer highlight={$currentStep === targetStep}>
  <span slot="title">
    OpenCV 処理
  </span>

  <div slot="body">
    <Button
      variant="unelevated"
      class="drawer-button"
      disabled={$currentStep !== targetStep || cvRunning || progress === 1}
      on:click={runCV}
    >
      {cvRunning ? '処理中...' : (progress === 1 ? 'CV 処理完了' : 'CV 処理開始')}
    </Button>
  </div>
</Drawer>

{#if cvRunning || progress === 1}
  <Portal target="body">
    <div class="download-btn" style={`--progress: ${progress * 100}%`}>
      <Fab disabled={progress !== 1 || creatingZip} on:click={download} title="zip ファイルをダウンロード">
        <SVGIcon icon={cvRunning ? mdiSpaceInvaders : mdiPackageDown} />
      </Fab>

      {#if progress !== 1}
        <CircularProgress class="progress" {progress} />
      {/if}

      {#if creatingZip}
        <CircularProgress class="progress four-colors" indeterminate fourColor />
      {/if}
    </div>
  </Portal>
{/if}

<style lang="scss">
  @use '@material/circular-progress/index' as circular-progress;
  @use '@material/theme/index' as theme;

  @keyframes zoomIn {
    from {
      transform: scale3d(0, 0, 0);
    }

    to {
      transform: scale3d(1, 1, 1);
    }
  }

  .download-btn {
    position: fixed;
    right: 20px;
    bottom: 20px;
    transition: all .3s;
    animation: zoomIn .3s easeOutBack;

    :global {
      button {
        background-color: theme.$green-500;
        transition: background-color .3s;

        &:disabled {
          background-color: var(--placeholder);
          transition: none;
          cursor: not-allowed;
          pointer-events: none;
        }
      }

      .progress {
        $progress-size: 68px;

        position: absolute;
        top: 50%;
        left: 50%;
        width: $progress-size;
        height: $progress-size;
        margin-top: $progress-size / -2;
        margin-left: $progress-size / -2;

        @include circular-progress.color(theme.$green-500);

        &.four-colors {
            @include circular-progress.indeterminate-colors(
              theme.$green-500 theme.$yellow-500 theme.$red-500 theme.$blue-500
            );
        }
      }
    }
  }
</style>
