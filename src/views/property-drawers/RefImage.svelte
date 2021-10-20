<script lang="ts">
  import ParamDrawer from './ParamDrawer.svelte';
  import ImageInfo from '../../components/ImageInfo.svelte';

  import { selectedInput, refImage, showRefImage } from '../../store';
  import { STEP } from '../../step';

  function setRefImage() {
    $refImage = $selectedInput;
  }

  function onParamUnlocked() {
    $refImage = undefined;
  }
</script>

<ParamDrawer
  title="基準画像"
  buttonLabel="表示中の画像を基準に設定"
  targetStep={STEP.SELECT_REF_IMAGE}
  bind:visible={$showRefImage}
  on:next={setRefImage}
  on:paramUnlocked={onParamUnlocked}
>
  <svelte:fragment slot="body">
    {#if $refImage}
      <ImageInfo image={$refImage} preview />
    {/if}
  </svelte:fragment>
</ParamDrawer>

<style lang="scss">

</style>
