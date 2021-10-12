<script lang="ts">
  import ImageInfo from './drawers/ImageInfo.svelte';
  import RefImage from './drawers/RefImage.svelte';
  import ROI from './drawers/ROI.svelte';
  import Pivot from './drawers/Pivot.svelte';
  import Scrollbar from '../components/Scrollbar.svelte';
</script>

<Scrollbar>
  <ImageInfo />
  <RefImage />
  <ROI />
  <Pivot />
</Scrollbar>

<style lang="scss">

</style>
