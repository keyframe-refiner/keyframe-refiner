<script lang="ts">
  import ParamDrawer from './ParamDrawer.svelte';

  import { selectedImage, refImage } from '../../store';
  import { valueOrNA } from '../../utils/value-or-na';
  import { STEP } from '../../step';

  function setRefImage() {
    $refImage = $selectedImage;
  }

  function onParamUnlocked() {
    $refImage = undefined;
  }
</script>

<ParamDrawer
  title="基準画像"
  buttonLabel="表示中の画像を基準に設定"
  targetStep={STEP.SELECT_REF_IMAGE}
  on:next={setRefImage}
  on:paramUnlocked={onParamUnlocked}
>
  <div slot="body">
    {#if $refImage}
      <img src={$refImage.blobURL} alt={$refImage.filename}>

      <table>
        <tbody>
          <tr>
            <td>ファイル名</td>
            <td>{valueOrNA($refImage?.filename)}</td>
          </tr>

          <tr>
            <td>幅</td>
            <td>{valueOrNA($refImage?.width)}</td>
          </tr>

          <tr>
            <td>高さ</td>
            <td>{valueOrNA($refImage?.height)}</td>
          </tr>
        </tbody>
      </table>
    {/if}
  </div>
</ParamDrawer>

<style lang="scss">
  table {
    margin-bottom: 10px;
    text-align: left;
  }

  div {
    text-align: center;
  }

  img {
    max-width: 60%;
    max-height: 60%;
  }
</style>
