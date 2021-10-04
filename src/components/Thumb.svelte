<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { mdiPlus, mdiTrashCanOutline } from '@mdi/js';

  import SVGIcon from './SVGIcon.svelte';
  import Uploader from './Uploader.svelte';
  import Preview from './Preview.svelte';

  import type { ImageCanvas } from '../image-canvas';

  export let type: 'image' | 'uploader';
  export let image: ImageCanvas | null = null;
  export let selected = false;

  const dispatch = createEventDispatcher();

  let input: HTMLInputElement;
  let uploader: Uploader;

  function upload() {
    if (!input.files || input.files.length === 0) {
      return;
    }

    uploader.uploadFiles(Array.from(input.files));
    input.value = ''; // clear inputs
  }
</script>

<div class="thumb" class:selected on:click {...$$restProps}>
  {#if type === 'image' && image}
    <Preview title={image?.filename} {image}>
      <span class="delete" title="この画像を削除" on:click={() => dispatch('delete')}>
        <SVGIcon icon={mdiTrashCanOutline}/>
      </span>
    </Preview>
  {:else if type === 'uploader'}
    <div class="uploader" title="画像をアップロード" on:click={() => input.click()}>
      <Uploader bind:this={uploader} />
      <SVGIcon icon={mdiPlus} class="uploader-mark" />
      <input type="file" accept="image/*" multiple bind:this={input} on:change={upload}>
    </div>
  {/if}
</div>

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

    :global {
      .preview-wrapper {
        position: relative;
        width: 100%;
        height: 100%;

        &:hover .delete {
          opacity: 1;
        }
      }
    }
  }

  .uploader {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
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
