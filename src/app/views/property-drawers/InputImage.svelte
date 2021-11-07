<script lang="ts">
  import { mdiEyeOutline, mdiEyeOffOutline } from '@mdi/js';

  import ImageInfo from '../../components/ImageInfo.svelte';
  import SVGIcon from '../../components/SVGIcon.svelte';
  import Drawer from '../../components/Drawer.svelte';
  import {
    selectedInput,
    showInputImage,
  } from '../../store';
</script>

<Drawer>
  <svelte:fragment slot="title">
    <span>元画像</span>
    <div class="control">
      <span
        class="control-icon toggle-visibility"
        title={$showInputImage ? '重ねて表示 OFF' : '重ねて表示 ON'}
        on:click|stopPropagation={() => { $showInputImage = !$showInputImage; }}
        >
        <SVGIcon icon={$showInputImage ? mdiEyeOutline : mdiEyeOffOutline} />
      </span>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="body">
    <ImageInfo image={$selectedInput} preview />
  </svelte:fragment>
</Drawer>

<style lang="scss">
  .control {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: flex-end;
  }

  .control-icon {
    width: 20px;
    height: 20px;
    margin: 0 3px;
  }
</style>
