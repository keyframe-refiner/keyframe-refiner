<script lang="ts">
  import piexif from 'piexifjs';
  import Preview from './Preview.svelte';
  import type { ImageCanvas } from '../utils/image-canvas';

  export let preview = false;
  export let allowEmpty = false;
  export let image: ImageCanvas | undefined;
  export let readonly: boolean = true;
  export let onRename: ((newName: string) => void) | undefined;

  $: filename = image?.filename.replace(/\.[^/.]+$/, '') || '';
  $: extName = image?.filename.split('.').pop()?.toLowerCase();

  $: xRes = image?.exif?.['0th'][piexif.ImageIFD.XResolution];
  $: yRes = image?.exif?.['0th'][piexif.ImageIFD.XResolution];

  function handleRename(newName: string) {
    if (readonly) {
      return;
    }

    onRename?.(newName ? `${newName}.${extName}` : image?.filename || '');
  }
</script>

<div class="image-info">
  {#if preview && image}
    <Preview {image} />
  {/if}

  {#if image || allowEmpty}
    <table>
      <tbody>
        <tr>
          <td>ファイル名</td>
          <td>
            {#if image}
              {#if readonly}
                <span>{image.filename}</span>
              {:else}
                <div class="rename">
                  <input type="text" bind:value={filename} on:input={e => handleRename(e.target.value)} on:keydown|stopPropagation />
                  <span>.{extName}</span>
                </div>
              {/if}
            {:else}
              N/A
            {/if}
          </td>
        </tr>

        <tr>
          <td>大きさ</td>
          <td>
            {#if image?.width && image?.width}
              {image.width} × {image.height}
            {:else}
              N/A
            {/if}
          </td>
        </tr>

        <tr>
          <td>解像度</td>
          <td>
            {#if xRes && yRes}
              {Math.floor(xRes[0] / xRes[1])} × {Math.floor(yRes[0] / yRes[1])}
            {:else}
              N/A
            {/if}
          </td>
        </tr>

        <tr>
          <td>メディアタイプ</td>
          <td>{image?.filetype || 'N/A'}</td>
        </tr>
      </tbody>
    </table>
  {/if}
</div>

<style lang="scss">
  .image-info {
    margin: 10px 0;
    text-align: center;

    :global(canvas) {
      max-width: 60%;
      max-height: 60%;
    }
  }

  table {
    text-align: left;
  }

  .rename {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.25em;

    input {
      width: 90px;
      background: var(--placeholder);
      border: none;
      outline: none;
      color: white;
      padding: 2px 4px;

      &:focus {
        outline: 2px solid var(--background-dimmed);
      }
    }

    span {
      flex-shrink: 0;
    }
  }
</style>
