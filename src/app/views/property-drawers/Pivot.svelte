<script lang="ts">
  import Button from '@smui/button/styled';
  import ParamDrawer from '../../components/ParamDrawer.svelte';
  import { STEP } from '../../constants';
  import {
    pivotPoint,
    refImage,
    ROI,
    stepManager,
    cvWorker,
    calculatingPivot,
    showPivot,
    showROI,
    detectMode,
  } from '../../store';

  const { currentStep } = stepManager;

  const targetStep = STEP.SET_PIVOT;

  async function requestPivot() {
    if (!$refImage) {
      return;
    }

    $calculatingPivot = true;

    try {
      $pivotPoint = await $cvWorker.requestPivot($detectMode, $refImage, $ROI);
    } catch (e) {
      // TODO: error handling
      alert(e?.message || e);
    }

    $calculatingPivot = false;
  }
</script>

<ParamDrawer
  {targetStep}
  title="基準位置"
  buttonLabel="基準位置を設定"
  bind:visible={$showPivot}
  on:next={() => { $showROI = true; $showPivot = true; }}
>
  <svelte:fragment slot="body">
    <table>
      <tbody>
        <tr>
          <td>x</td>
          <td class="ellipsis">{$pivotPoint.x}</td>
        </tr>

        <tr>
          <td>y</td>
          <td class="ellipsis">{$pivotPoint.y}</td>
        </tr>
      </tbody>
    </table>

    <Button
      variant="unelevated"
      class="request-pivot"
      disabled={$calculatingPivot || $currentStep !== targetStep}
      on:click={requestPivot}
    >
      {$calculatingPivot ? '自動算出中...' : '自動算出'}
    </Button>
  </svelte:fragment>
</ParamDrawer>

<style lang="scss">
  @use '@material/theme/index' as theme;

  :global(.drawer .request-pivot) {
    width: 100%;
    margin-top: 10px;

    &:not(:disabled) {
      background-color: theme.$blue-grey-500;
    }
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
      white-space: inherit;
    }
  }
</style>
