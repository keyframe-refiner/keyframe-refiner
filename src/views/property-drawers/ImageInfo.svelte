<script lang="ts">
  import piexif from 'piexifjs';
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

  $: xRes = image?.exif['0th'][piexif.ImageIFD.XResolution];
  $: yRes = image?.exif['0th'][piexif.ImageIFD.XResolution];
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

        {#if xRes && yRes}
          <tr>
            <td>解像度</td>
            <td>
              {Math.floor(xRes[0] / xRes[1])}
              x
              {Math.floor(yRes[0] / yRes[1])}
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</Drawer>

<style lang="scss">

</style>
