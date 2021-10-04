<script lang="ts">
  import { afterUpdate, createEventDispatcher } from 'svelte';
  import { mdiPlus, mdiTrashCanOutline } from '@mdi/js';

  import SVGIcon from './SVGIcon.svelte';
  import Uploader from './Uploader.svelte';

  import type { ImageCanvas } from '../image-canvas';

  export let type: 'image' | 'uploader';
  export let image: ImageCanvas | null = null;
  export let selected = false;

  const dispatch = createEventDispatcher();

  let container: HTMLElement;
  let canvas: HTMLCanvasElement;
  let input: HTMLInputElement;
  let uploader: Uploader;

  let containerWidth: number;
  let containerHeight: number;

  function upload() {
    if (!input.files || input.files.length === 0) {
      return;
    }

    uploader.uploadFiles(Array.from(input.files));
    input.value = ''; // clear inputs
  }

  function repaint() {
    // repaint
    if (type !== 'image' || !image || !container) {
      return;
    }

    // size unchanged
    if (containerWidth === container.clientWidth &&
        containerHeight === container.clientHeight) {
      return;
    }

    containerWidth = container.clientWidth;
    containerHeight = container.clientHeight;

    const ratio = image.width / image.height;
    let dw = 0;
    let dh = 0;

    if (ratio > 1) {
      // width > height
      dw = containerWidth;
      dh = containerHeight / ratio;
    } else {
      // height > width
      dw = containerWidth / ratio;
      dh = containerHeight;
    }

    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(
      image.canvas,
      0, 0, image.width, image.height,
      0, 0, dw, dh,
    );
  }

  afterUpdate(repaint);
</script>

<div class="thumb" class:selected on:click {...$$restProps}>
  {#if type === 'image'}
    <div class="preview" title={image?.filename} bind:this={container}>
      <span class="delete" title="この画像を削除" on:click={() => dispatch('delete')}>
        <SVGIcon icon={mdiTrashCanOutline}/>
      </span>
      <canvas bind:this={canvas}></canvas>
    </div>
  {:else}
    <div class="uploader" title="画像をアップロード" on:click={() => input.click()}>
      <Uploader bind:this={uploader} />
      <SVGIcon icon={mdiPlus} class="uploader-mark" />
      <input type="file" accept="image/*" multiple bind:this={input} on:change={upload}>
    </div>
  {/if}
</div>

<svelte:window on:resize={repaint} />

<style lang="scss">
  input {
    display: none;
  }

  .thumb {
    --thumb-size: 150px;

    width: var(--thumb-size);
    height: var(--thumb-size);
    outline: none;
    color: darken(#565a64, 10);
    border: 3px solid currentColor;
    border-radius: 3px;
    margin-bottom: 20px;

    &:hover {
      color: lighten(#565a64, 10);
    }

    &.selected {
      border-color: var(--mdc-theme-primary);
    }
  }

  .preview,
  .uploader {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .preview {
    position: relative;

    &:hover .delete {
      opacity: 1;
    }
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

  .uploader {
    cursor: pointer;

    :global(.uploader-mark) {
      width: 50%;
      height: 50%;
    }
  }
</style>
