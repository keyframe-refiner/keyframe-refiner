<script lang="ts">
  import ImageInfo from '../../components/ImageInfo.svelte';
  import Drawer from '../../components/Drawer.svelte';
  import { getImageState } from '../../utils/image-state';
  import {
    selectedIndex,
    selectedInput,
    selectedOutput,
    refImage,
    stepManager,
    inputList,
    outputList,
  } from '../../store';
  import { STEP } from '../../constants';
  const { currentStep } = stepManager;

  $: image = getImageState($selectedInput!, $selectedOutput, $refImage, $currentStep).image;
  $: readonly = $currentStep === STEP.RUN_CV && $selectedOutput instanceof Error;

  function handleRename(newName: string) {
    if (!$selectedInput) {
      return;
    }

    if ($currentStep !== STEP.RUN_CV) {
      const newImage = $selectedInput.rename(newName);

      if ($refImage === $selectedInput) {
        $refImage = newImage;
      }

      $inputList = $inputList.splice($selectedIndex, 1, newImage);
    } else if ($selectedOutput && !($selectedOutput instanceof Error)) {
      $outputList = $outputList.splice($selectedIndex, 1, $selectedOutput.rename(newName));
    }
  }
</script>

<Drawer>
  <span slot="title">{$currentStep === STEP.RUN_CV ? '出力画像情報' : '画像情報'}</span>

  <svelte:fragment slot="body">
    <ImageInfo {image} allowEmpty onRename={handleRename} {readonly} />
  </svelte:fragment>
</Drawer>

<style lang="scss">

</style>
