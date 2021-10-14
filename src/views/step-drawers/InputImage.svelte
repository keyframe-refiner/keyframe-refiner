<script lang="ts">
  import { mdiEyeOutline, mdiEyeOffOutline } from '@mdi/js';

  import SVGIcon from '../../components/SVGIcon.svelte';
  import Drawer from '../../components/Drawer.svelte';
  import { valueOrNA } from '../../utils/value-or-na';
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

  <div slot="body">
    <img src={$selectedInput?.blobURL} alt={$selectedInput?.filename}>

    <table>
      <tbody>
        <tr>
          <td>ファイル名</td>
          <td>{valueOrNA($selectedInput?.filename)}</td>
        </tr>

        <tr>
          <td>幅</td>
          <td>{valueOrNA($selectedInput?.width)}</td>
        </tr>

        <tr>
          <td>高さ</td>
          <td>{valueOrNA($selectedInput?.height)}</td>
        </tr>
    </table>
  </div>
</Drawer>

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
