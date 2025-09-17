<script lang="ts">
  import pAll from 'p-all';
  import { onMount } from 'svelte';
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
    outputMIME,
    filenameTemplate,
    fitFrame,
  } from '../../store';
  import { mimeToExt } from '../../utils/mime-to-ext';
  import { MIMETYPE } from '../../../shared/mimetype';

  const { currentStep } = stepManager;
  const targetStep = STEP.RUN_CV;
  let progress = 0;
  let cvRunning = false;
  let isDownloading = false;

  // reset progress when step changed
  currentStep.subscribe(() => {
    progress = 0;
  });

  function formatName(image: ImageCanvas, index: number) {
    // remove extension from filename
    const filename = image.filename.replace(/\.[^/.]+$/, '');
    const filetype = $outputMIME === MIMETYPE.AS_IS ? image.filetype : $outputMIME;

    const newName = $filenameTemplate
      .replace('{filename}', filename)
      .replace('{index}', String(index + 1)) + '.' + mimeToExt(filetype);

    return image.rename(newName).changeFiletype(filetype);
  }

  onMount(() => {
    function renameAllOutputImages() {
      $outputList = $outputList.map((image, i) => {
        if (image instanceof ImageCanvas) {
          const originalFile = $inputList.get(i);
          return formatName(
            originalFile
              ? image.rename(originalFile.filename).changeFiletype(originalFile.filetype)
              : image,
            i,
          );
        }

        return image;
      });
    }

    const unlisten = [
      filenameTemplate.subscribe(() => {
        renameAllOutputImages();
      }),
      outputMIME.subscribe(() => {
        renameAllOutputImages();
      }),
    ];

    return () => {
      unlisten.forEach(fn => fn());
    };
  });

  async function runCV() {
    if (!$refImage) {
      return;
    }

    cvRunning = true;
    progress = 0;

    await $cvWorker.requestProcessing(
      $detectMode, $fitFrame, [...$inputList], $refImage, $ROI, $pivotPoint,
      (idx, res, prg) => {
        if (res instanceof Error) {
          $outputList = $outputList.set(idx, res);
        } else {
          $outputList = $outputList.set(idx, formatName(res, idx));
        }

        progress = prg;
      },
    );

    progress = 1;
    cvRunning = false;
  }

  // returns date string in format YYYYMMDD_HHMMSS
  function getDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');

    return `${year}${month}${day}_${hour}${minute}${second}`;
  }

  function getOutputImages() {
    return [...$outputList]
      // .filter(res => res instanceof ImageCanvas)
      .map((res, i) => {
        if (res instanceof ImageCanvas) {
          return res;
        }

        // fallback to input image
        const fallback = $inputList.get(i);

        if (fallback) {
          return fallback.rename(`failed-${fallback.filename}`).changeFiletype($outputMIME);
        }

        return null;
      })
      .filter((image) => image !== null);
  }

  async function downloadZip() {
    const zipWriter = new ZipWriter(new BlobWriter('application/zip'));

    const actions = getOutputImages()
      .map((image) => async () => {
        await zipWriter.add(
          image.filename,
          new BlobReader(await image.toBlob()),
          { bufferedWrite: true },
        );
      });

    // HACK: image.toBlob() is a time-consuming task and will freeze the UI for seconds,
    // so wait for UI updating here...
    await new Promise(resolve => setTimeout(resolve));

    await pAll(actions, {
      concurrency: navigator.hardwareConcurrency || 4,
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(await zipWriter.close());
    link.download = `result-${getDateString()}.zip`;
    link.click();
  }

  async function downloadFs() {
    const dirHandle = await (window as any).showDirectoryPicker({ id: 'keyframe-refiner-output', mode: 'readwrite' });
    const saveDirHandle = await dirHandle.getDirectoryHandle(`result-${getDateString()}`, { create: true });

    const actions = getOutputImages()
      .map((image) => async () => {
        const fileHandle = await saveDirHandle.getFileHandle(image.filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(await image.toBlob());
        await writable.close();
      });

    // HACK: image.toBlob() is a time-consuming task and will freeze the UI for seconds,
    // so wait for UI updating here...
    await new Promise(resolve => setTimeout(resolve));

    await pAll(actions, {
      concurrency: navigator.hardwareConcurrency || 4,
    });

    alert(`${actions.length} 枚の画像を ${saveDirHandle.name} フォルダに保存しました`);
  }

  async function download() {
    try {
      isDownloading = true;
      if ('showDirectoryPicker' in window) {
        await downloadFs();
      } else {
        await downloadZip();
      }
    } finally {
      isDownloading = false;
    }
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
      <Fab disabled={progress !== 1 || isDownloading} on:click={download} title="処理結果をダウンロード">
        <SVGIcon icon={cvRunning ? mdiSpaceInvaders : mdiPackageDown} />
      </Fab>

      {#if progress !== 1}
        <CircularProgress class="progress" {progress} />
      {/if}

      {#if isDownloading}
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
