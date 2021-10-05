<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import Button from '@smui/button/styled';
  import { Title, Content, Actions } from '@smui/dialog/styled';
  import { mdiPlus, mdiTrashCanOutline } from '@mdi/js';

  import { inputList, selectedIndex } from '../store';
  import SVGIcon from '../components/SVGIcon.svelte';
  import Uploader from '../components/Uploader.svelte';
  import Preview from '../components/Preview.svelte';
  import RootDialog from '../components/RootDialog.svelte';
  import Scrollbar from '../components/Scrollbar.svelte';

  let uploader: Uploader;
  let scrollbar: Scrollbar;
  let deleteIndex: number;
  let openDeleteConfirm = false;
  let fileInput: HTMLInputElement;
  const thumbs: (HTMLElement | null)[] = [];

  function navigate(delta: number) {
    const targetIndex = $selectedIndex + delta;

    if (targetIndex < 0 || targetIndex > $inputList.length - 1) {
      return;
    }

    $selectedIndex = targetIndex;

    // TODO: find a better approach
    const target = thumbs[targetIndex];

    if (target) {
      scrollbar.getScrollbar().scrollIntoView(target, {
        alignToTop: delta === -1,
        offsetTop: 10,
        offsetBottom: targetIndex === $inputList.length - 1 ? 200 : 10,
        onlyScrollIfNeeded: targetIndex !== 0 && targetIndex !== $inputList.length - 1,
      });
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    e.stopPropagation();

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        navigate(-1);
        break;

      case 'ArrowDown':
      case 'ArrowRight':
        navigate(1);
        break;
    }
  }

  function deleteImage() {
    $inputList.splice(deleteIndex, 1);
    $inputList = $inputList; // force update

    if (deleteIndex === $selectedIndex) {
      $selectedIndex = clamp($selectedIndex, 0, $inputList.length - 1);
    }
  }

  function requestDelete(index: number) {
    deleteIndex = index;
    openDeleteConfirm = true;
  }

  function upload() {
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }

    uploader.uploadFiles(Array.from(fileInput.files));
    fileInput.value = ''; // clear inputs
  }
</script>

<Scrollbar class="image-track" bind:this={scrollbar}>
  {#each $inputList as image, i (image.filename)}
    <div
      class="thumb"
      class:selected={i === $selectedIndex}
      on:click={() => { $selectedIndex = i; }}
      bind:this={thumbs[i]}
    >
      <Preview title={image.filename} {image} />
      <span class="delete" title="この画像を削除" on:click={() => requestDelete(i)}>
        <SVGIcon icon={mdiTrashCanOutline}/>
      </span>
    </div>
  {/each}

  <div class="uploader" title="画像をアップロード" on:click={() => fileInput.click()}>
    <Uploader bind:this={uploader} />
    <span class="uploader-mark">
      <SVGIcon icon={mdiPlus} />
    </span>
    <input type="file" accept="image/*" multiple bind:this={fileInput} on:change={upload}>
  </div>
</Scrollbar>

<RootDialog
  scrimClickAction=""
  escapeKeyAction=""
  bind:open={openDeleteConfirm}
  on:closed={() => { deleteIndex = -1; }}
>
  <Title>画像の削除</Title>
  <Content>“{$inputList[deleteIndex]?.filename}”を削除しますか？</Content>
  <Actions>
    <Button on:click={() => {
      openDeleteConfirm = false;
    }}>キャンセル</Button>

    <Button color="secondary" on:click={() => {
      openDeleteConfirm = false;
      deleteImage();
    }}>削除</Button>
  </Actions>
</RootDialog>

<svelte:window on:keydown={onKeyDown} />

<style lang="scss">
  :global {
    .image-track {
      height: 100%;
      user-select: none;

      .scrollbar-wrapper {
        padding: 10px;
      }
    }
  }

  .thumb,
  .uploader {
    --thumb-size: 150px;

    width: var(--thumb-size);
    height: var(--thumb-size);
    outline: none;
    color: var(--placeholder);
    border: 3px solid currentColor;
    border-radius: 3px;
    margin-bottom: 20px;

    &:hover {
      color: var(--placeholder-light);
    }
  }

  .thumb {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    &.selected {
      border-color: var(--mdc-theme-primary);
    }

    &:hover .delete {
      opacity: 1;
    }

    :global {
      .preview-wrapper {
        width: 100%;
        height: 100%;
      }
    }
  }

  .uploader {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    input {
      display: none;
    }
  }

  .uploader-mark{
    width: 50%;
    height: 50%;
  }

  .delete {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    right: 0;
    width: 30px;
    height: 30px;
    background: rgba(0, 0, 0, 0.75);
    cursor: pointer;
    border-bottom-left-radius: 3px;
    opacity: 0;
    transition: color .2s;

    &:hover {
      color: var(--mdc-theme-surface);
    }
  }
</style>
