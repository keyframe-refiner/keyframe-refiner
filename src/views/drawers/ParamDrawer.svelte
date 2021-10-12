<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import Button from '@smui/button/styled';
  import { Title, Content, Actions } from '@smui/dialog/styled';
  import { mdiLockOutline } from '@mdi/js';

  import Drawer from '../../components/Drawer.svelte';
  import RootDialog from '../../components/RootDialog.svelte';
  import SVGIcon from '../../components/SVGIcon.svelte';
  import { outputList, currentStep } from '../../store';
  import { STEP, stepDescription } from '../../step';

  export let title: string;
  export let targetStep: STEP;
  export let buttonLabel: string;

  let openUnlockConfirm = false;

  const dispatch = createEventDispatcher();

  function next() {
    currentStep.forward();

    dispatch('next');
  }

  function unlockParam() {
    $currentStep = targetStep;
    $outputList = $outputList.clear();

    dispatch('paramUnlocked');
  }
</script>

<Drawer highlight={$currentStep === targetStep}>
  <svelte:fragment slot="title">
    <span>{title}</span>

    {#if $currentStep && currentStep.hasFinished(targetStep)}
      <div class="control" in:fade out:fade>
        <span class="control-icon" on:click|stopPropagation={() => { openUnlockConfirm = true; }}>
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
  }
</style>
