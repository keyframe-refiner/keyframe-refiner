<script lang="ts">
  import clamp from 'lodash/clamp';
  import { ROI, pivotPoint, refImage, stepManager, showROI } from '../../store';
  import { Rect, Point } from '../../utils/record-factory';
  import { VariableTracker } from '../../utils/variable-tracker';
  import { STEP } from '../../step';
  import ParamDrawer from '../../components/ParamDrawer.svelte';

  const { currentStep } = stepManager;

  const targetStep = STEP.SET_ROI;

  const tracker = new VariableTracker(() => [
    $currentStep,
  ]);

  $: if (tracker.stale() && $refImage && $currentStep === targetStep) {
    if ($ROI.width === 0 || $ROI.height === 0) {
      $ROI = new Rect({
        x1: 0,
        y1: 0,
        x2: $refImage.width,
        y2: $refImage.height / 6,
      });
    } else {
      $ROI = new Rect({
        x1: clamp($ROI.x1, 0, $refImage.width),
        y1: clamp($ROI.y1, 0, $refImage.height),
        x2: clamp($ROI.x2, 0, $refImage.width),
        y2: clamp($ROI.y2, 0, $refImage.height),
      });
    }
  }

  function adjustPivot() {
    $pivotPoint = new Point({
      x: clamp($pivotPoint.x, $ROI.x1, $ROI.x2),
      y: clamp($pivotPoint.y, $ROI.y1, $ROI.y2),
    });

    $showROI = true;
  }
</script>

<ParamDrawer
  {targetStep}
  title="対象領域"
  buttonLabel="対象領域を設定"
  bind:visible={$showROI}
  on:next={adjustPivot}
>
  <svelte:fragment slot="body">
    <table>
      <tbody>
        <tr>
          <td>left</td>
          <td>{$ROI.x1}</td>
        </tr>

        <tr>
          <td>top</td>
          <td>{$ROI.y1}</td>
        </tr>

        <tr>
          <td>right</td>
          <td>{$ROI.x2}</td>
        </tr>

        <tr>
          <td>bottom</td>
          <td>{$ROI.y2}</td>
        </tr>
      </tbody>
    </table>
  </svelte:fragment>
</ParamDrawer>

<style lang="scss">

</style>
