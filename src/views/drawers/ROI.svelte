<script lang="ts">
  import { ROI, refImage, currentStep } from '../../store';
  import { Rect } from '../../record-factory';
  import { VariableTracker } from '../../utils/variable-tracker';
  import { STEP } from '../../step';
  import ParamDrawer from './ParamDrawer.svelte';

  const targetStep = STEP.SET_ROI;

  const tracker = new VariableTracker(() => [
    $refImage,
  ]);

  $: if (tracker.stale() && $refImage && $currentStep === targetStep) {
    $ROI = new Rect({
      x1: 0,
      y1: 0,
      x2: $refImage.width,
      y2: Math.floor($refImage.height / 3),
    });
  }
</script>

<ParamDrawer
  {targetStep}
  title="対象領域"
  buttonLabel="対象領域を設定"
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
