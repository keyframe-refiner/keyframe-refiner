<script lang="ts">
  import { selectedOutput } from '../store';
  import { ImageCanvas } from '../image-canvas';
  import InputImage from './step-drawers/InputImage.svelte';
  import ImageInfo from './step-drawers/ImageInfo.svelte';
  import RefImage from './step-drawers/RefImage.svelte';
  import ROI from './step-drawers/ROI.svelte';
  import Pivot from './step-drawers/Pivot.svelte';
  import CVRunner from './step-drawers/CVRunner.svelte';
  import Scrollbar from '../components/Scrollbar.svelte';
</script>

<Scrollbar>
  <ImageInfo />
  {#if $selectedOutput instanceof ImageCanvas}
    <InputImage />
  {/if}
  <RefImage />
  <ROI />
  <Pivot />
  <CVRunner />
</Scrollbar>

<style lang="scss">

</style>
