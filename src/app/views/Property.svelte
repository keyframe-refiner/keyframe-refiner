<script lang="ts">
  import { selectedOutput } from '../store';
  import { ImageCanvas } from '../utils/image-canvas';
  import InputImage from './property-drawers/InputImage.svelte';
  import SelectedImage from './property-drawers/SelectedImage.svelte';
  import RefImage from './property-drawers/RefImage.svelte';
  import ROI from './property-drawers/ROI.svelte';
  import Pivot from './property-drawers/Pivot.svelte';
  import CVRunner from './property-drawers/CVRunner.svelte';
  import Scrollbar from '../components/Scrollbar.svelte';
</script>

<Scrollbar>
  <SelectedImage />
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
