<script lang="ts">
  import clamp from 'lodash-es/clamp';

  import { inputList, selectedIndex, selectedImage } from '../store';
  import Scrollbar from './Scrollbar.svelte';
  import Thumb from './Thumb.svelte';

  let scrollbar: Scrollbar;

  function navigate(delta: number) {
    const targetIndex = $selectedIndex + delta;

    if (targetIndex < 0 || targetIndex > $inputList.length - 1) {
      return;
    }

    $selectedIndex = targetIndex;

    // TODO: find a better approach
    const target = document.querySelector(`.thumb:nth-child(${targetIndex + 1})`) as HTMLElement;

    if (target) {
      scrollbar.getScrollbar().scrollIntoView(target, {
        onlyScrollIfNeeded: true,
        alignToTop: delta === -1,
        offsetTop: 10,
        offsetBottom: targetIndex === $inputList.length - 1 ? 200 : 10,
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

  function deleteImage(index: number) {
    $inputList.splice(index, 1);
    $inputList = $inputList; // force update

    if (index === $selectedIndex) {
      $selectedIndex = clamp($selectedIndex, 0, $inputList.length - 1);
    }
  }
</script>

<Scrollbar class="image-track" bind:this={scrollbar}>
  {#each $inputList as image, i (image.filename)}
    <Thumb
      type="image"
      {image}
      selected={image === $selectedImage}
      on:delete={() => deleteImage(i)}
      on:click={() => { $selectedIndex = i; }}
    />
  {/each}

  <Thumb type="uploader" />
</Scrollbar>

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
</style>
