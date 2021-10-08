<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { onMount, afterUpdate, tick } from 'svelte';
  import Button from '@smui/button/styled';
  import { Title, Content, Actions } from '@smui/dialog/styled';
  import { mdiPlus, mdiTrashCanOutline } from '@mdi/js';

  import { inputList, selectedIndex, selectedImage } from '../store';
  import SVGIcon from '../components/SVGIcon.svelte';
  import Uploader from '../components/Uploader.svelte';
  import RootDialog from '../components/RootDialog.svelte';
  import Scrollbar from '../components/Scrollbar.svelte';

  export let thumbSize = 150;
  export let thumbSpacing = 20;
  $: thumbHeight = thumbSize + thumbSpacing;

  let uploader: Uploader;
  let scrollbar: Scrollbar;
  let deleteIndex: number;
  let openDeleteConfirm = false;
  let fileInput: HTMLInputElement;
  const thumbs: (HTMLElement | null)[] = [];

  let startIndex = 0;
  let endIndex = 0;

  $: [beforeHeight, afterHeight] = [
    startIndex * thumbHeight,
    ($inputList.length - endIndex - 1) * thumbHeight - thumbSpacing,
  ];

  onMount(async () => {
    const s = await scrollbar.getScrollbar();

    s.addListener(sliceItem);
  });

  afterUpdate(() => {
    sliceItem();
  });

  async function sliceItem() {
    const s = await scrollbar.getScrollbar();

    // visible area: [scrollTop, scrollTop + containerHeight]
    const top = s.scrollTop;
    const bottom = top + s.size.container.height;

    const start = Math.floor(top / thumbHeight);
    const end = Math.ceil(bottom / thumbHeight);
    const extraCount = Math.floor((end - start + 1) / 2);

    startIndex = Math.max(0, start - extraCount);
    endIndex = Math.min($inputList.length - 1, end + extraCount);
  }

  async function navigate(delta: number) {
    if (openDeleteConfirm) {
      return;
    }

    const targetIndex = $selectedIndex + delta;

    if (targetIndex < 0 || targetIndex > $inputList.length - 1) {
      return;
    }

    $selectedIndex = targetIndex;

    const top = targetIndex * thumbHeight;
    const bottom = top + thumbHeight;

    const s = await scrollbar.getScrollbar();

    if (targetIndex === 0) {
      s.setMomentum(0, -s.scrollTop);
    } else if (targetIndex === $inputList.length - 1) {
      s.setMomentum(0, s.limit.y - s.scrollTop);
    } else {
      const offsetTop = top - s.scrollTop - 10;
      const offsetBottom = bottom - (s.scrollTop + s.size.container.height) + 10;

      if (offsetTop < 0) {
        s.setMomentum(0, offsetTop);
      } else if (offsetBottom > 0) {
        s.setMomentum(0, offsetBottom);
      }
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    e.stopPropagation();

    switch (e.key) {
      case 'Delete':
        requestDelete($selectedIndex);
        break;

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

  async function deleteImage() {
    const [image] = $inputList.splice(deleteIndex, 1);

    $inputList = $inputList; // force update

    if (deleteIndex === $selectedIndex) {
      $selectedIndex = clamp($selectedIndex, 0, $inputList.length - 1);
    }

    if (image) {
      // revoke object url after image is removed from DOM
      await tick();
      image.destory();
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

<div
  class="image-track"
  style={`
    --thumb-size: ${thumbSize}px;
    --thumb-spacing: ${thumbSpacing}px;
  `}
>
  <Scrollbar bind:this={scrollbar}>
    <div
      class="thumb-placeholder placeholder-before"
      style={`height: ${beforeHeight}px`}
    ></div>

    {#each $inputList.slice(startIndex, endIndex + 1) as image, i (image.filename)}
      <div
        class="thumb"
        class:selected={image === $selectedImage}
        on:click={() => { $selectedIndex = startIndex + i; }}
        bind:this={thumbs[i]}
      >
        <img src={image.blobURL} alt={image.filename} title={image.filename} on:mousedown|preventDefault />
        <span class="delete" title="この画像を削除" on:click={() => requestDelete(i)}>
          <SVGIcon icon={mdiTrashCanOutline}/>
        </span>
      </div>
    {/each}

    <div
      class="thumb-placeholder placeholder-after"
      style={`height: ${afterHeight}px`}
    ></div>

    <div class="uploader" title="画像をアップロード" on:click={() => fileInput.click()}>
      <Uploader bind:this={uploader} />
      <span class="uploader-mark">
        <SVGIcon icon={mdiPlus} />
      </span>
      <input type="file" accept="image/*" multiple bind:this={fileInput} on:change={upload}>
    </div>
  </Scrollbar>
</div>

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
  .image-track {
    user-select: none;

    :global {
      .scrollbar {
        height: calc(100vh - var(--header-height));
      }

      .scrollbar-wrapper {
        padding: 10px;
      }
    }
  }

  .thumb,
  .uploader {
    width: var(--thumb-size);
    height: var(--thumb-size);
    outline: none;
    color: var(--placeholder);
    border: 3px solid currentColor;
    border-radius: 3px;
    margin-bottom: var(--thumb-spacing);

    &:hover {
      color: var(--placeholder-light);
    }
  }

  .thumb {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      max-width: 100%;
      max-height: 100%;
    }

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

  .thumb-placeholder {
    width: 100%;
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
