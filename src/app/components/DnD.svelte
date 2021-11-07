<script lang="ts">
  import Uploader from './Uploader.svelte';

  let uploader: Uploader;
  let dragEntered = 0;

  function handleDrop(e: DragEvent) {
    dragEntered = 0;

    if (!e.dataTransfer?.files.length) {
      return;
    }

    uploader.uploadFiles(Array.from(e.dataTransfer.files));
  }
</script>

<svelte:window
  on:dragover|preventDefault
  on:drop|preventDefault={handleDrop}
  on:dragenter={() => { dragEntered++; }}
  on:dragleave={() => { dragEntered--; }}
/>

<Uploader bind:this={uploader} />

{#if dragEntered}
  <div>ファイルをドロップしてアップロード</div>
{/if}

<style>
  div {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    font-size: 48px;
    border: 5px dashed var(--mdc-theme-primary);
    background: rgba(0, 0, 0, 0.5);
    box-sizing: border-box;
    z-index: 999;
  }
</style>
