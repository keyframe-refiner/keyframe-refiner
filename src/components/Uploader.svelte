<script lang="ts">
  import { Title, Content, Actions } from '@smui/dialog/styled';
  import CircularProgress from '@smui/circular-progress/styled';
  import Button from '@smui/button/styled';
  import Portal from 'svelte-portal';

  import RootDialog from './RootDialog.svelte';
  import { ImageCanvas } from '../image-canvas';
  import { inputList } from '../store';

  let openDuplicatedDialog = false;
  let openUnsupportDialog = false;

  let isUploading = false;
  let progress = 0;

  let duplicatedFiles: File[] = [];
  let unsupportFiles: File[] = [];

  function filterDuplicatedFiles(files: File[]) {
    const result: File[] = [];
    const dup: File[] = [];

    for (const f of files) {
      const existed = $inputList.some(image => image.filename === f.name);

      if (existed) {
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

  async function filterUnsupportFiles(files: File[]) {
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

    const results = await filterUnsupportFiles(filterDuplicatedFiles(files));
    const totalCount = results.length;

    for (let i = 0; i < totalCount; i++) {
      $inputList.push(await ImageCanvas.fromFile(results[i]));
      $inputList = $inputList; // force update

      progress = (i + 1) / totalCount;
    }

    isUploading = false;
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

<Portal target="#image-viewer">
  <CircularProgress class="upload-progress" closed={!isUploading} {progress} />
</Portal>

<style lang="scss">
  :global {
    .upload-progress {
      position: absolute;
      left: 20px;
      top: 20px;
      width: 50px;
      height: 50px;
    }
  }
</style>
