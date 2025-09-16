<script lang="ts">
  import Button from '@smui/button/styled';
  import { Title, Content, Actions } from '@smui/dialog/styled';
  import Select, { Option } from '@smui/select/styled';
  import HelperText from '@smui/textfield/helper-text/styled';
  import Textfield from '@smui/textfield/styled';
  import {
    mdiAlphaHCircleOutline,
    mdiAlphaFBoxOutline,
    mdiGithub,
    mdiBugCheckOutline,
    mdiFitToPageOutline,
    mdiCog,
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
    outputMIME,
    filenameTemplate,
  } from '../store';
  import { MIMETYPE } from '../../shared/mimetype';
  import { mimeToExt } from "../utils/mime-to-ext";

  export let openDialog = false;

  const { currentStep } = stepManager;

  let internalDetectMoe = $detectMode;
  let internalFilenameTemplate = $filenameTemplate;
  let internalOutputMIME = $outputMIME;

  function openModeDialog() {
    openDialog = true;
    internalDetectMoe = $detectMode;
    internalFilenameTemplate = $filenameTemplate;
    internalOutputMIME = $outputMIME;
  }

  function adjustStep() {
    if ($currentStep === STEP.RUN_CV) {
      $currentStep = STEP.SET_PIVOT;
      $currentStep = STEP.RUN_CV; // force update
      $outputList = $outputList.clear();
    }
  }

  function saveSettings() {
    $filenameTemplate = internalFilenameTemplate;
    $outputMIME = internalOutputMIME;

    // only reset step when mode changed
    if (internalDetectMoe === $detectMode) {
      return;
    }

    if (internalDetectMoe === MODE.PEG_HOLE) {
      $fitFrame = false;
    }

    $detectMode = internalDetectMoe;
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

<RootDialog id="mode-dialog" bind:open={openDialog} on:MDCDialog:closed={() => { internalDetectMoe = $detectMode; }}>
  <Title>各種設定</Title>
  <Content>
    <div class="section">
      <Select bind:value={internalDetectMoe} label="位置合わせ方式" variant="outlined">
      <SVGIcon
        class="mdc-select__icon"
        icon={internalDetectMoe === MODE.PEG_HOLE ? mdiAlphaHCircleOutline : mdiAlphaFBoxOutline}
        slot="leadingIcon"
      />
      <Option value={MODE.PEG_HOLE}>
        <SVGIcon icon={mdiAlphaHCircleOutline} />
        タップ穴を基準にする
      </Option>
      <Option value={MODE.FRAME}>
        <SVGIcon icon={mdiAlphaFBoxOutline} />
        フレームを基準にする
      </Option>
    </Select>
    </div>

    <div class="section">
      <Select bind:value={internalOutputMIME} label="出力ファイル形式" variant="outlined">
        <Option value={MIMETYPE.AS_IS}>元ファイルと同じ形式</Option>
        <Option value={MIMETYPE.PNG}>PNG (透過対応)</Option>
        <Option value={MIMETYPE.JPEG}>JPEG (非透過, 高圧縮)</Option>
        <Option value={MIMETYPE.WEBP}>WebP (透過対応, 高圧縮)</Option>
        <Option value={MIMETYPE.TGA}>TGA (透過対応, 非圧縮)</Option>
      </Select>
    </div>

    <div class="section filename-section">
      <div class="filename-input">
        <Textfield
          style="width: 100%;"
          bind:value={internalFilenameTemplate}
          label="出力ファイル名テンプレート"
          variant="outlined"
        >
          <HelperText slot="helper" persistent>
            {'{filename} - 元ファイル名, {index} - 連番'}
          </HelperText>
        </Textfield>
      </div>
      <span>.{mimeToExt(internalOutputMIME)}</span>
    </div>
  </Content>

  <Actions>
    <Button>閉じる</Button>
    <Button on:click={saveSettings}>適用</Button>
  </Actions>
</RootDialog>

<div class="settings">
  <span
    class="icon change-mode"
    title="各種設定"
    on:click={openModeDialog}
  >
    <SVGIcon icon={mdiCog} />
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

  .section {
    margin-bottom: 2em;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .filename-section {
    display: flex;
    align-items: flex-end;

    span {
      font-size: 12px;
      margin-left: 0.5em;
      margin-bottom: 20px;
    }
  }

  .filename-input {
    flex: 1;
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
        padding: 1em;
        min-height: 200px;
        min-width: 350px;
        overflow: visible;
      }

      .mdc-select {
        width: 100%;
      }

      .smui-select--standard.mdc-select--with-leading-icon .mdc-select__icon {
        margin-left: 6px;
        margin-right: -30px;
      }

      .mdc-select__menu {
        position: fixed;
        width: 320px;
        margin-top: 50px;
        left: auto !important;
        top: auto !important;
        z-index: 999999 !important;
      }
    }
  }
</style>
