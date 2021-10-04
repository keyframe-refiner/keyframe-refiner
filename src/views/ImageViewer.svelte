<script lang="ts">
  import { selectedImage } from '../store';
  import Preview from '../components/Preview.svelte';
</script>

<div class="viewer">
  <Preview image={$selectedImage}></Preview>
</div>

<style lang="scss">
  .viewer {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    :global {
      .preview-wrapper {
        width: 80%;
        height: 80%;
      }
    }
  }
</style>
