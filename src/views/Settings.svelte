<script lang="ts">
  import Radio from '@smui/radio/styled';
  import Button from '@smui/button/styled';
  import List, { Item, Graphic, Text } from '@smui/list/styled';
  import { Title, Content, Actions, InitialFocus } from '@smui/dialog/styled';
  import {
    mdiAlphaHCircleOutline,
    mdiAlphaFBoxOutline,
  } from '@mdi/js';

  import SVGIcon from '../components/SVGIcon.svelte';
  import RootDialog from '../components/RootDialog.svelte';
  import { MODE, STEP } from '../constants';
  import {
    detectMode,
    stepManager,
    outputList,
    refImage,
    showRefImage,
    showPivot,
    showROI,
  } from '../store';

  export let open = false;

  const { currentStep } = stepManager;

  let selection = $detectMode;

  function openSettings() {
    open = true;
    selection = $detectMode;
  }

  function changeMode() {
    if (selection === $detectMode) {
      return;
    }

    $detectMode = selection;
    $showRefImage = false;
    $showPivot = false;
    $showROI = false;
    $refImage = undefined;
    $outputList = $outputList.clear();
    $currentStep = stepManager.hasFinished(STEP.OPEN_IMAGES) ? STEP.SELECT_REF_IMAGE : STEP.OPEN_IMAGES;
  }
</script>

<RootDialog id="settings" bind:open  on:MDCDialog:closed={() => { selection = $detectMode; }}>
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

<span title="位置合わせ方式を変更" on:click={openSettings}>
  <SVGIcon icon={$detectMode === MODE.PEG_HOLE ? mdiAlphaHCircleOutline : mdiAlphaFBoxOutline} />
</span>

<style lang="scss">
  span {
    display: inline-block;
    width: 30px;
    height: 30px;
    cursor: pointer;
    color: #ffccbc;

    transition: transform .3s easeOutBack;

    &:hover {
      transform: scale(1.1);
    }
  }

  :global {
    #settings {
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
