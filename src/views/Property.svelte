<script lang="ts">
  import DataTable, { Body, Row, Cell } from '@smui/data-table';

  import Drawer from '../components/Drawer.svelte';
  import { selectedImage, pivotPoint, ROI } from '../store';

  function valueOrNA(value: any) {
    return value ?? 'N/A';
  }
</script>

<Drawer class="property-section image-info">
  <span slot="header">画像情報</span>

  <div slot="body">
    <DataTable>
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

        <Row>
          <Cell>メディアタイプ</Cell>
          <Cell>{valueOrNA($selectedImage?.filetype)}</Cell>
        </Row>
      </Body>
    </DataTable>
  </div>
</Drawer>

<Drawer class="property-section roi">
  <span slot="header">対象領域</span>

  <div slot="body">
    <DataTable>
      <Body>
        <Row>
          <Cell>left</Cell>
          <Cell>{$ROI.x1}</Cell>
        </Row>

        <Row>
          <Cell>top</Cell>
          <Cell>{$ROI.y1}</Cell>
        </Row>

        <Row>
          <Cell>right</Cell>
          <Cell>{$ROI.x2}</Cell>
        </Row>

        <Row>
          <Cell>bottom</Cell>
          <Cell>{$ROI.y2}</Cell>
        </Row>
      </Body>
    </DataTable>
  </div>
</Drawer>

<Drawer class="property-section pivot-point">
  <span slot="header">基準位置</span>

  <div slot="body">
    <DataTable>
      <Body>
        <Row>
          <Cell>x</Cell>
          <Cell title={valueOrNA($pivotPoint?.x)}>{valueOrNA($pivotPoint?.x)}</Cell>
        </Row>

        <Row>
          <Cell>y</Cell>
          <Cell title={valueOrNA($pivotPoint?.y)}>{valueOrNA($pivotPoint?.y)}</Cell>
        </Row>
      </Body>
    </DataTable>
  </div>
</Drawer>

<style lang="scss">
  :global {
    .property-section:not(:nth-child(1)) {
      margin-top: 20px;
      border-top: 1px solid var(--background-dimmed);
    }
  }
</style>
