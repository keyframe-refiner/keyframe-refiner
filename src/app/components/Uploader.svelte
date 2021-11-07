<script lang="ts">
  import { Title, Content, Actions } from '@smui/dialog/styled';
  import CircularProgress from '@smui/circular-progress/styled';
  import Button from '@smui/button/styled';
  import Portal from 'svelte-portal';

  import RootDialog from './RootDialog.svelte';
  import { ImageCanvas } from '../utils/image-canvas';
  import { inputList, stepManager } from '../store';
  import { STEP } from '../constants';

  const { currentStep } = stepManager;

  let openDuplicatedDialog = false;
  let openUnsupportDialog = false;

  let isUploading = false;
  let progress = 0;

  let duplicatedFiles: File[] = [];
  let unsupportFiles: File[] = [];

  function filterDuplicatedFiles(files: File[]) {
    const result: File[] = [];
    const dup: File[] = [];

    const loadedFilenames = {};

    for (const image of $inputList) {
      loadedFilenames[image.filename] = true;
    }

    for (const f of files) {
      if (loadedFilenames[f.name]) {
        dup.push(f);
      } else {
        result.push(f);
      }
    }

    if (dup.length !== 0) {
      duplicatedFiles = dup;
      openDuplicatedDialog = true;
    }

    return result;
  }

  function filterUnsupportFiles(files: File[]) {
    const result: File[] = [];
    const unsup: File[] = [];

    for (const f of files) {
      if (f.type.startsWith('image/')) {
        result.push(f);
      } else {
        unsup.push(f);
      }
    }

    if (unsup.length !== 0) {
      unsupportFiles = unsup;
      openUnsupportDialog = true;
    }

    return result;
  }

  export async function uploadFiles(files: File[]) {
    isUploading = true;
    progress = 0;

    const results = filterUnsupportFiles(filterDuplicatedFiles(files));
    const totalCount = results.length;

    // read images in parallel
    const reader = results.map(ImageCanvas.fromFile);

    for (let i = 0; i < totalCount; i++) {
      $inputList = $inputList.push(await reader[i]);
      progress = (i + 1) / totalCount;
    }

    isUploading = false;

    if ($currentStep === STEP.OPEN_IMAGES && $inputList.size !== 0) {
      stepManager.forward();
    }
  }
</script>

<RootDialog
  bind:open={openDuplicatedDialog}
  on:closed={() => { duplicatedFiles.length = 0; }}
>
  <Title>重複ファイル</Title>
  <Content>
    <p>以下のファイルがすでに追加されています。</p>
    <ul>
      {#each duplicatedFiles as file}
        <li>{file.name}</li>
      {/each}
    </ul>
  </Content>
  <Actions>
    <Button on:click={() => {
      openDuplicatedDialog = false;
    }}>閉じる</Button>
  </Actions>
</RootDialog>

<RootDialog
  bind:open={openUnsupportDialog}
  on:closed={() => { unsupportFiles.length = 0; }}
>
  <Title>非サポートファイル</Title>
  <Content>
    <p>以下のファイル形式はサポートされていません。</p>
    <ul>
      {#each unsupportFiles as file}
        <li>{file.name}</li>
      {/each}
    </ul>
  </Content>
  <Actions>
    <Button on:click={() => {
      openUnsupportDialog = false;
    }}>閉じる</Button>
  </Actions>
</RootDialog>

{#if isUploading}
  <Portal target="#image-viewer">
    <CircularProgress class="upload-progress" {progress} />
  </Portal>
{/if}

<style lang="scss">
  :global {
    .upload-progress {
      position: absolute !important;
      left: 20px;
      top: 20px;
      width: 50px;
      height: 50px;
    }
  }
</style>
