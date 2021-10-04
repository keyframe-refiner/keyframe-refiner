<script lang="ts">
  import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';

  import Drawer from '../components/Drawer.svelte';
  import { selectedImage } from '../store';

  function valueOrNA(value: any) {
    return value || 'N/A';
  }
</script>

<Drawer class="image-info">
  <span slot="header">画像情報</span>

  <div slot="body">
    <DataTable>
      <Head>
        <Row>
          <Cell>プロパティー</Cell>
          <Cell>値</Cell>
        </Row>
      </Head>

      <Body>
        <Row>
          <Cell>ファイル名</Cell>
          <Cell title={valueOrNA($selectedImage?.filename)}>{valueOrNA($selectedImage?.filename)}</Cell>
        </Row>

        <Row>
          <Cell>幅</Cell>
          <Cell>{valueOrNA($selectedImage?.width)}</Cell>
        </Row>

        <Row>
          <Cell>高さ</Cell>
          <Cell>{valueOrNA($selectedImage?.height)}</Cell>
        </Row>
      </Body>
    </DataTable>
  </div>
</Drawer>

<style lang="scss">

</style>
