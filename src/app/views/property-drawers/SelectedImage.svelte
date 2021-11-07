<script lang="ts">
  import ImageInfo from '../../components/ImageInfo.svelte';
  import Drawer from '../../components/Drawer.svelte';
  import { getImageState } from '../../utils/image-state';
  import {
    selectedInput,
    selectedOutput,
    refImage,
    stepManager,
  } from '../../store';
  const { currentStep } = stepManager;

  $: image = getImageState($selectedInput!, $selectedOutput, $refImage, $currentStep).image;
</script>

<Drawer>
  <span slot="title">画像情報</span>

  <svelte:fragment slot="body">
    <ImageInfo {image} allowEmpty />
  </svelte:fragment>
</Drawer>

<style lang="scss">

</style>
