<script lang="ts">
  import { pivotPoint, refImage, currentStep } from '../../store';
  import { VariableTracker } from '../../utils/variable-tracker';
  import { STEP } from '../../step';
  import ParamDrawer from './ParamDrawer.svelte';

  const targetStep = STEP.SET_PIVOT;

  const tracker = new VariableTracker(() => [
    $refImage,
  ]);

  $: if (tracker.stale() && $refImage && $currentStep === targetStep) {
    // TODO: auto calculate pivot
  }
</script>

<ParamDrawer
  {targetStep}
  title="基準位置"
  buttonLabel="基準位置を設定"
>
  <svelte:fragment slot="body">
    <table>
      <tbody>
        <tr>
          <td>x</td>
          <td>{$pivotPoint.x}</td>
        </tr>

        <tr>
          <td>y</td>
          <td>{$pivotPoint.y}</td>
        </tr>
      </tbody>
    </table>
  </svelte:fragment>
</ParamDrawer>

<style lang="scss">

</style>
