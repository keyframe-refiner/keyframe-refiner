<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { onMount, afterUpdate, tick } from 'svelte';
  import Portal from 'svelte-portal';
  import Button from '@smui/button/styled';
  import { Title, Content, Actions } from '@smui/dialog/styled';
  import { mdiPlus, mdiTrashCanOutline, mdiDeleteSweep, mdiGhost, mdiAlertCircleOutline } from '@mdi/js';

  import { STEP } from '../step';
  import { ImageState, getImageState } from '../utils/image-state';
  import SVGIcon from '../components/SVGIcon.svelte';
  import Uploader from '../components/Uploader.svelte';
  import RootDialog from '../components/RootDialog.svelte';
  import Scrollbar from '../components/Scrollbar.svelte';
  import {
    inputList,
    outputList,
    selectedIndex,
    refImage,
    stepManager,
  } from '../store';

  const { currentStep } = stepManager;

  type ImageStateWithIndex = ImageState & {
    index: number,
  };

  export let thumbSize = 150;
  export let thumbSpacing = 20;
  $: thumbHeight = thumbSize + thumbSpacing;
  $: allowEdit = $currentStep !== STEP.RUN_CV;

  let uploader: Uploader;
  let scrollbar: Scrollbar;
  let deleteIndex: number;
  let deleteFilename: string | undefined;
  let openDeleteConfirm = false;
  let openClearConfirm = false;
  let fileInput: HTMLInputElement;

  let startIndex = 0;
  let endIndex = 0;

  $: displayList = getDisplayList(startIndex, endIndex); // bind variables here for reactivity

  $: [beforeHeight, afterHeight] = [
    startIndex * thumbHeight,
    ($inputList.size - endIndex - 1) * thumbHeight - thumbSpacing,
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
    endIndex = Math.min($inputList.size - 1, end + extraCount);
  }

  function getDisplayList(start: number, end: number) {
    if ($inputList.isEmpty()) {
      return [];
    }

    const results: ImageStateWithIndex[] = [];

    for (let i = start; i <= end; i++) {
      const input = $inputList.get(i)!;
      const output = $outputList.get(i);

      results.push({
        ...getImageState(input, output, $refImage, $currentStep),
        index: i,
      });
    }

    return results;
  }

  async function navigate(delta: number) {
    if (openDeleteConfirm || openClearConfirm) {
      return;
    }

    const targetIndex = $selectedIndex + delta;

    if (targetIndex < 0 || targetIndex > $inputList.size - 1) {
      return;
    }

    $selectedIndex = targetIndex;

    const top = targetIndex * thumbHeight;
    const bottom = top + thumbHeight;

    const s = await scrollbar.getScrollbar();

    if (targetIndex === 0) {
      s.setMomentum(0, -s.scrollTop);
    } else if (targetIndex === $inputList.size - 1) {
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
    const image = $inputList.get(deleteIndex)!;
    $inputList = $inputList.remove(deleteIndex);

    if (deleteIndex === $selectedIndex) {
      $selectedIndex = clamp($selectedIndex, 0, $inputList.size - 1);
    }

    if (image === $refImage) {
      $refImage = undefined;
      $currentStep = STEP.SELECT_REF_IMAGE;
    }

    // revoke object url after image is removed from DOM
    await tick();
    image.destory();
  }

  function requestDelete(index: number) {
    const image = $inputList.get(index)!;

    deleteIndex = index;
    openDeleteConfirm = true;
    deleteFilename = image.filename;

    if (image === $refImage) {
      deleteFilename += '（基準画像）';
    }
  }

  async function clearAll() {
    const currentList = $inputList;
    $inputList = $inputList.clear();
    $selectedIndex = 0;
    $refImage = undefined;
    stepManager.reset();

    await tick();
    currentList.forEach(image => image.destory());
  }

  function requestClear() {
    openClearConfirm = true;
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

    {#each displayList as { image, error, index, dimmed } (image)}
      <div
        class="thumb"
        class:dimmed
        class:error
        class:selected={$selectedIndex === index}
        on:click={() => { $selectedIndex = index; }}
      >
        <img
          src={image.blobURL}
          alt={image.filename}
          title={image.filename}
          on:mousedown|preventDefault
        />

        {#if error}
          <span class="error-icon" title={error}>
            <SVGIcon icon={mdiAlertCircleOutline} />
          </span>
        {/if}

        {#if allowEdit}
          <span class="delete-icon" title="この画像を削除" on:click|stopPropagation={() => requestDelete(index)}>
            <SVGIcon icon={mdiTrashCanOutline} />
          </span>
        {/if}

        {#if image === $refImage}
          <span class="reference-image-icon" title="基準画像">
            <SVGIcon icon={mdiGhost} />
          </span>
        {/if}
      </div>
    {/each}

    <div
      class="thumb-placeholder placeholder-after"
      style={`height: ${afterHeight}px`}
    ></div>

    {#if allowEdit}
      <div class="uploader" title="画像をアップロード" on:click={() => fileInput.click()}>
        <Uploader bind:this={uploader} />
        <span class="uploader-icon">
          <SVGIcon icon={mdiPlus} />
        </span>
        <input type="file" accept="image/*" multiple bind:this={fileInput} on:change={upload}>
      </div>
    {/if}
  </Scrollbar>
</div>

{#if allowEdit && $inputList.size !== 0}
  <Portal target="body">
    <div class="clear-all" on:click={requestClear}>
      <span>すべての画像を削除</span>
      <SVGIcon icon={mdiDeleteSweep} />
    </div>
  </Portal>
{/if}

<RootDialog
  scrimClickAction=""
  escapeKeyAction=""
  bind:open={openDeleteConfirm}
>
  <Title>画像の削除</Title>
  <Content>“{deleteFilename}”を削除しますか？</Content>
  <Actions>
    <Button>キャンセル</Button>
    <Button color="secondary" on:click={deleteImage}>削除</Button>
  </Actions>
</RootDialog>

<RootDialog
  scrimClickAction=""
  escapeKeyAction=""
  bind:open={openClearConfirm}
>
  <Title>画像の削除</Title>
  <Content>すべての画像を削除しますか？</Content>
  <Actions>
    <Button>キャンセル</Button>
    <Button color="secondary" on:click={clearAll}>削除</Button>
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

    &:hover {
      color: var(--placeholder-light);
    }
  }

  .thumb {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--thumb-spacing);

    img {
      max-width: 100%;
      max-height: 100%;
    }

    &.selected {
      border-color: var(--mdc-theme-primary);
    }

    &.dimmed img {
      opacity: var(--dimmed-image-opacity);
    }

    &.error {
      border-color: var(--mdc-theme-secondary);
    }

    &:hover .delete-icon {
      opacity: 1;
    }

    :global {
      .preview-wrapper {
        width: 100%;
        height: 100%;
      }
    }
  }

  .error-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50%;
    height: 50%;
    color: var(--mdc-theme-secondary);
    transform: translate(-50%, -50%);
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

  .uploader-icon {
    width: 50%;
    height: 50%;
  }

  .delete-icon,
  .reference-image-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    width: 30px;
    height: 30px;
    background: rgba(0, 0, 0, 0.75);
  }

  .delete-icon {
    top: 0;
    right: 0;
    cursor: pointer;
    border-bottom-left-radius: 3px;
    opacity: 0;
    transition: color .2s;

    &:hover {
      color: var(--mdc-theme-surface);
    }
  }

  .reference-image-icon {
    top: 0;
    left: 0;
    color: #ffbf43;
    border-bottom-right-radius: 3px;
  }

  .clear-all {
    --clear-button-height: 40px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    left: 0;
    bottom: 10px;
    padding: 10px;
    padding-right: 0;
    height: var(--clear-button-height);
    background-color: var(--mdc-theme-secondary);
    transform: translate3d(-100%, 0, 0);
    opacity: 0.2;
    animation: fade-out 2s easeOutCubic;
    transition: all 0.3s easeOutBack;
    cursor: pointer;
    z-index: 1;

    &:hover {
      transform: translate3d(0, 0, 0);
      opacity: 1;
      animation: none;
    }

    &::before {
      content: '';
      position: absolute;
      right: 100%;
      width: 100%;
      height: 100%;
      background-color: inherit;
    }

    :global(.icon) {
      position: absolute;
      left: 100%;
      padding: 8px;
      width: var(--clear-button-height);
      height: var(--clear-button-height);
      background-color: inherit;
      border-radius: 0 50% 50% 0;
      animation: fly-in-left 0.3s ease-out;
    }
  }

  @keyframes fade-out {
    0%, 50% {
      opacity: 1;
    }

    100% {
      opacity: 0.2;
    }
  }

  @keyframes fly-in-left {
    0% {
      transform: translate3d(-100%, 0, 0);
    }

    100% {
      transform: translate3d(0, 0, 0);
    }
  }
</style>
