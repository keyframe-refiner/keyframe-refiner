<script lang="ts">
  import Drawer from '../../components/Drawer.svelte';
  import { valueOrNA } from '../../utils/value-or-na';
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

  <div slot="body">
    <table>
      <tbody>
        <tr>
          <td>ファイル名</td>
          <td>{valueOrNA(image?.filename)}</td>
        </tr>

        <tr>
          <td>幅</td>
          <td>{valueOrNA(image?.width)}</td>
        </tr>

        <tr>
          <td>高さ</td>
          <td>{valueOrNA(image?.height)}</td>
        </tr>

        <tr>
          <td>メディアタイプ</td>
          <td>{valueOrNA(image?.filetype)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</Drawer>

<style lang="scss">

</style>
