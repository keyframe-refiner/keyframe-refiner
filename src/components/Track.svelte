<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { Title, Content, Actions } from '@smui/dialog/styled';
  import Button from '@smui/button/styled';

  import { inputList, selectedIndex, selectedImage } from '../store';
  import RootDialog from './RootDialog.svelte';
  import Scrollbar from './Scrollbar.svelte';
  import Thumb from './Thumb.svelte';

  let scrollbar: Scrollbar;
  let deleteIndex: number;
  let openDeleteConfirm = false;

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
</script>

<Scrollbar class="image-track" bind:this={scrollbar}>
  {#each $inputList as image, i (image.filename)}
    <Thumb
      type="image"
      {image}
      selected={image === $selectedImage}
      on:delete={() => requestDelete(i)}
      on:click={() => { $selectedIndex = i; }}
    />
  {/each}

  <Thumb type="uploader" />
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
</style>
