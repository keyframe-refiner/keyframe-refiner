<script lang="ts">
  import Radio from '@smui/radio/styled';
  import Button from '@smui/button/styled';
  import List, { Item, Graphic, Text } from '@smui/list/styled';
  import { Title, Content, Actions, InitialFocus } from '@smui/dialog/styled';
  import {
    mdiAlphaHCircleOutline,
    mdiAlphaFBoxOutline,
    mdiGithub,
    mdiBugCheckOutline,
    mdiFitToPageOutline,
  } from '@mdi/js';

  import SVGIcon from '../components/SVGIcon.svelte';
  import RootDialog from '../components/RootDialog.svelte';
  import { MODE, STEP } from '../constants';
  import {
    detectMode,
    debugMode,
    fitFrame,
    stepManager,
    outputList,
    refImage,
    showRefImage,
    showPivot,
    showROI,
    cvWorker,
  } from '../store';

  export let openDialog = false;

  const { currentStep } = stepManager;

  let selection = $detectMode;

  function openModeDialog() {
    openDialog = true;
    selection = $detectMode;
  }

  function adjustStep() {
    if ($currentStep === STEP.RUN_CV) {
      $currentStep = STEP.SET_PIVOT;
      $currentStep = STEP.RUN_CV; // force update
      $outputList = $outputList.clear();
    }
  }

  function changeMode() {
    if (selection === $detectMode) {
      return;
    }

    if (selection === MODE.PEG_HOLE) {
      $fitFrame = false;
    }

    $detectMode = selection;
    $showRefImage = false;
    $showPivot = false;
    $showROI = false;
    $refImage = undefined;
    $outputList = $outputList.clear();
    $currentStep = stepManager.hasFinished(STEP.OPEN_IMAGES) ? STEP.SELECT_REF_IMAGE : STEP.OPEN_IMAGES;
  }

  function toggleDebug() {
    $debugMode = !$debugMode;
    $cvWorker.setDebugMode($debugMode);
    adjustStep();
  }

  function toggleFitFrame() {
    $fitFrame = !$fitFrame;
    adjustStep();
  }
</script>

<RootDialog id="mode-dialog" bind:open={openDialog} on:MDCDialog:closed={() => { selection = $detectMode; }}>
  <Title>位置合わせ方式</Title>
  <Content>
    <List radioList>
      <Item use={[InitialFocus]}>
        <Graphic>
          <Radio bind:group={selection} value={MODE.PEG_HOLE} />
        </Graphic>
        <Text>
          <SVGIcon icon={mdiAlphaHCircleOutline} />
          タップ穴を基準にする
        </Text>
      </Item>
      <Item>
        <Graphic>
          <Radio bind:group={selection} value={MODE.FRAME} />
        </Graphic>
        <Text>
          <SVGIcon icon={mdiAlphaFBoxOutline} />
          フレームを基準にする
        </Text>
      </Item>
    </List>
  </Content>

  <Actions>
    <Button>閉じる</Button>
    <Button on:click={changeMode}>適用</Button>
  </Actions>
</RootDialog>

<div class="settings">
  <span
    class="icon change-mode"
    title="位置合わせ方式を変更"
    on:click={openModeDialog}
  >
    <SVGIcon icon={$detectMode === MODE.PEG_HOLE ? mdiAlphaHCircleOutline : mdiAlphaFBoxOutline} />
  </span>

  {#if $detectMode === MODE.FRAME}
    <span
    class="icon toggle-fit-frame"
    class:disabled={!$fitFrame}
    on:click={toggleFitFrame}
    title={$fitFrame ? 'フレームサイズ合わせ OFF' : 'フレームサイズ合わせ ON'}
    >
      <SVGIcon icon={mdiFitToPageOutline} />
    </span>
  {/if}

  <span
    class="icon toggle-debug"
    class:disabled={!$debugMode}
    on:click={toggleDebug}
    title={$debugMode ? 'デバッグモード OFF' : 'デバッグモード ON'}
  >
    <SVGIcon icon={mdiBugCheckOutline} />
  </span>

  <a class="icon github" href="https://github.com/textcunma/keyframe-refiner" target="_blank">
    <SVGIcon icon={mdiGithub} />
  </a>
</div>

<style lang="scss">
  .icon {
    display: inline-block;
    width: 32px;
    height: 32px;
    margin-left: 10px;
    cursor: pointer;
    transition: transform .3s easeOutBack;

    &.disabled {
      color: var(--placeholder);
    }

    &:hover {
      transform: scale(1.1);
    }
  }

  .change-mode {
    color: #ffccbc;
  }

  .toggle-fit-frame {
    color: #b2dfdb;
  }

  .toggle-debug {
    color: #f0f4c3;
  }

  .github {
    color: #d1c4e9;
  }

  :global {
    #mode-dialog {
      .mdc-dialog__content {
        padding: 0;
      }

      .mdc-deprecated-list {
        color: var(--placeholder);
        padding: 10px 0px !important;
      }

      .mdc-deprecated-list-item {
        --mdc-theme-secondary: var(--mdc-theme-primary);

        padding: 0 25px !important;

        &:focus ::before {
          opacity: 0;
        }
      }

      .mdc-deprecated-list-item__graphic {
        margin-right: 5px;
      }

      .mdc-deprecated-list-item__text {
        display: inline-flex;

        .icon {
          color: var(--placeholder);
        }
      }
    }
  }
</style>
