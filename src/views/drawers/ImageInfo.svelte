<script lang="ts">
  import Drawer from '../../components/Drawer.svelte';
  import { selectedImage } from '../../store';
  import { valueOrNA } from '../../utils/value-or-na';
</script>

<Drawer>
  <span slot="title">画像情報</span>

  <div slot="body">
    <table>
      <tbody>
        <tr>
          <td>ファイル名</td>
          <td>{valueOrNA($selectedImage?.filename)}</td>
        </tr>

        <tr>
          <td>幅</td>
          <td>{valueOrNA($selectedImage?.width)}</td>
        </tr>

        <tr>
          <td>高さ</td>
          <td>{valueOrNA($selectedImage?.height)}</td>
        </tr>

        <tr>
          <td>メディアタイプ</td>
          <td>{valueOrNA($selectedImage?.filetype)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</Drawer>

<style lang="scss">

</style>
