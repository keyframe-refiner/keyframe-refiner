<script lang="ts">
  // TODO: refactor
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import Button from '@smui/button/styled';
  import { Title, Content, Actions } from '@smui/dialog/styled';
  import { mdiLockOutline, mdiEyeOutline, mdiEyeOffOutline } from '@mdi/js';

  import Drawer from './Drawer.svelte';
  import RootDialog from './RootDialog.svelte';
  import SVGIcon from './SVGIcon.svelte';
  import { STEP, stepDescription } from '../step';
  import {
    outputList,
    stepManager,
    showPivot,
    showROI,
    showRefImage,
  } from '../store';

  export let title: string;
  export let targetStep: STEP;
  export let buttonLabel: string;
  export let visible: boolean;

  const { currentStep } = stepManager;

  let openUnlockConfirm = false;

  const dispatch = createEventDispatcher();

  function next() {
    stepManager.forward();

    dispatch('next');
  }

  function unlockParam() {
    $currentStep = targetStep;
    $showRefImage = false;
    $showPivot = false;
    $showROI = targetStep === STEP.SET_PIVOT;
    $outputList = $outputList.clear();

    dispatch('paramUnlocked');
  }
</script>

<Drawer highlight={$currentStep === targetStep}>
  <svelte:fragment slot="title">
    <span>{title}</span>

    {#if $currentStep && stepManager.hasFinished(targetStep)}
      <div class="control" in:fade out:fade>
        <span
        class="control-icon toggle-visibility"
        title={visible ? '重ねて表示 OFF' : '重ねて表示 ON'}
        on:click|stopPropagation={() => { visible = !visible; }}
        >
          <SVGIcon icon={visible ? mdiEyeOutline : mdiEyeOffOutline} />
        </span>

        <span
          class="control-icon unlock-param"
          title="パラメータロックを解除"
          on:click|stopPropagation={() => { openUnlockConfirm = true; }}
        >
          <SVGIcon icon={mdiLockOutline} />
        </span>
      </div>
    {/if}
  </svelte:fragment>

  <div slot="body">
    <slot name="body"></slot>

    <Button
      variant="unelevated"
      class="drawer-button"
      disabled={$currentStep !== targetStep}
      on:click={next}
    >
      {buttonLabel}
    </Button>
  </div>
</Drawer>

<RootDialog
  scrimClickAction=""
  escapeKeyAction=""
  bind:open={openUnlockConfirm}
>
  <Title>パラメータロック解除</Title>
  <Content>{`パラメータのロックを解除すると「${stepDescription[targetStep]}」に戻ります。よろしいですか？`}</Content>
  <Actions>
    <Button>いいえ</Button>
    <Button color="secondary" on:click={unlockParam}>はい</Button>
  </Actions>
</RootDialog>

<style lang="scss">
  :global(.drawer-button) {
    width: 100%;

    &:not(:only-child) {
      margin-top: 10px;
    }
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
