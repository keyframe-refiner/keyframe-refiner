<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { getContext, hasContext, onMount } from 'svelte';
  import type Scrollbar from 'smooth-scrollbar';

  import { defaultTransformer } from '../utils/coord-transformer';

  export let cropRect = {
    // (left, top)
    x1: 0,
    y1: 0,
    // (right, bottom)
    x2: 0,
    y2: 0,
  };

  export let localXYtoRealXY = defaultTransformer;
  export let realXYtoLocalXY = defaultTransformer;

  $: [localX1, localY1] = realXYtoLocalXY(cropRect.x1, cropRect.y1);
  $: [localX2, localY2] = realXYtoLocalXY(cropRect.x2, cropRect.y2);

  let container: HTMLElement;
  let cropping = false;

  enum Direction {
    NONE = 0,
    N = 1 << 0,
    S = 1 << 1,
    W = 1 << 2,
    E = 1 << 3,
    NW = N | W,
    NE = N | E,
    SW = S | W,
    SE = S | E,
    ALL = N | S | W | E,
  };

  let direction: Direction = Direction.NONE;

  const pointerPosition = {
    clientX: 0,
    clientY: 0,
  };

  const pointerOffset = {
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  };

  let getScrollbar: () => Promise<Scrollbar>;

  if (hasContext('getScrollbar')) {
    getScrollbar = getContext('getScrollbar');
  }

  onMount(async () => {
    if (getScrollbar) {
      const scrollbar = await getScrollbar();

      scrollbar.addListener(() => {
        if (cropping) {
          update();
        }
      });
    }
  });

  function dispatchEvent() {
    container.dispatchEvent(new CustomEvent('pan-move', {
      bubbles: true,
      detail: {
        pointerX: pointerPosition.clientX,
        pointerY: pointerPosition.clientY,
      },
    }));
  }

  function updateAll() {
    const bounding = container.getBoundingClientRect();

    const px = pointerPosition.clientX - bounding.left;
    const py = pointerPosition.clientY - bounding.top;

    const cropWidth = pointerOffset.x1 - pointerOffset.x2;
    const cropHeight = pointerOffset.y1 - pointerOffset.y2;

    const x1 = clamp(px - pointerOffset.x1, 0, bounding.width - cropWidth);
    const y1 = clamp(py - pointerOffset.y1, 0, bounding.height - cropHeight);
    const x2 = x1 + cropWidth;
    const y2 = y1 + cropHeight;

    [cropRect.x1, cropRect.y1] = localXYtoRealXY(x1, y1);
    [cropRect.x2, cropRect.y2] = localXYtoRealXY(x2, y2);

    dispatchEvent();
  }

  function update() {
    if (direction === Direction.NONE) {
      return;
    }

    if (direction === Direction.ALL) {
      updateAll();
      return;
    }

    const bounding = container.getBoundingClientRect();

    const lx = clamp(pointerPosition.clientX - bounding.left, 0, bounding.width);
    const ly = clamp(pointerPosition.clientY - bounding.top, 0, bounding.height);

    let [x1, y1, x2, y2] = [localX1, localY1, localX2, localY2];

    if (direction & Direction.N) {
      if (ly < y2) {
        y1 = ly;
      } else {
        y1 = y2;
        y2 = ly;
        // invert resize direction
        direction = (direction - Direction.N) | Direction.S;
      }
    }

    if (direction & Direction.S) {
      if (ly > y1) {
        y2 = ly;
      } else {
        y2 = y1;
        y1 = ly;
        direction = (direction - Direction.S) | Direction.N;
      }
    }

    if (direction & Direction.W) {
      if (lx < x2) {
        x1 = lx;
      } else {
        x1 = x2;
        x2 = lx;
        direction = (direction - Direction.W) | Direction.E;
      }
    }

    if (direction & Direction.E) {
      if (lx > x1) {
        x2 = lx;
      } else {
        x2 = x1;
        x1 = lx;
        direction = (direction - Direction.E) | Direction.W;
      }
    }

    [cropRect.x1, cropRect.y1] = localXYtoRealXY(x1, y1);
    [cropRect.x2, cropRect.y2] = localXYtoRealXY(x2, y2);

    dispatchEvent();
  }

  function onPointerDown(dir: Direction) {
    return (e: PointerEvent) => {
      e.stopPropagation();

      cropping = true;
      direction = dir;

      pointerPosition.clientX = e.clientX;
      pointerPosition.clientY = e.clientY;

      if (dir === Direction.ALL) {
        const bounding = container.getBoundingClientRect();
        const px = e.clientX - bounding.left;
        const py = e.clientY - bounding.top;

        pointerOffset.x1 = px - localX1;
        pointerOffset.y1 = py - localY1;
        pointerOffset.x2 = px - localX2;
        pointerOffset.y2 = py - localY2;
      }
    };
  }

  function onPointerUp() {
    cropping = false;
    direction = Direction.NONE;
  }

  function onPointerMove(e: PointerEvent) {
    if (!cropping) {
      return;
    }

    pointerPosition.clientX = e.clientX;
    pointerPosition.clientY = e.clientY;

    update();
  }

  function startNew(e: PointerEvent) {
    cropping = true;
    direction = Direction.NW;

    const bounding = container.getBoundingClientRect();
    const px = e.clientX - bounding.left;
    const py = e.clientY - bounding.top;

    pointerPosition.clientX = e.clientX;
    pointerPosition.clientY = e.clientY;

    [cropRect.x1, cropRect.y1] = [cropRect.x2, cropRect.y2] = localXYtoRealXY(px, py);
  }
</script>

<div
  class="cropper"
  bind:this={container}
  style={`
    --cropper-x1: ${localX1}px;
    --cropper-y1: ${localY1}px;
    --cropper-x2: ${localX2}px;
    --cropper-y2: ${localY2}px;
  `}
>
  <div class="cropper-mask-wrapper" on:pointerdown={startNew}>
    <div class="cropper-mask mask-top"></div>
    <div class="cropper-mask mask-left"></div>
    <div class="cropper-mask mask-bottom"></div>
    <div class="cropper-mask mask-right"></div>
  </div>

  <div
    class="cropper-box"
    class:grabbing={cropping && direction === Direction.ALL}
    on:pointerdown={onPointerDown(Direction.ALL)}
  >
    <svg class="cropper-border">
      <rect class="cropper-border-black" x="0" y="0" width="100%" height="100%" />
      <rect class="cropper-border-white" x="0" y="0" width="100%" height="100%" />
    </svg>

    <div class="cropper-handle handle-n" on:pointerdown={onPointerDown(Direction.N)}></div>
    <div class="cropper-handle handle-s" on:pointerdown={onPointerDown(Direction.S)}></div>
    <div class="cropper-handle handle-w" on:pointerdown={onPointerDown(Direction.W)}></div>
    <div class="cropper-handle handle-e" on:pointerdown={onPointerDown(Direction.E)}></div>

    <div class="cropper-handle handle-nw" on:pointerdown={onPointerDown(Direction.NW)}></div>
    <div class="cropper-handle handle-sw" on:pointerdown={onPointerDown(Direction.SW)}></div>
    <div class="cropper-handle handle-ne" on:pointerdown={onPointerDown(Direction.NE)}></div>
    <div class="cropper-handle handle-se" on:pointerdown={onPointerDown(Direction.SE)}></div>

    <div class="cropper-info" class:show={cropping && direction !== Direction.ALL}>
      {localX2 - localX1} x {localY2 - localY1}
    </div>
  </div>
</div>

<svelte:window
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:blur={onPointerUp}
/>

<style lang="scss">
  @keyframes border-spiner {
    to {
      stroke-dashoffset: 12;
    }
  }

  .cropper {
    --handle-size: 10px;
    --handle-color: var(--mdc-theme-primary);
    --mask-bg-color: rgba(0, 0, 0, 0.6);

    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    user-select: none;
  }

  .cropper-box {
    position: absolute;
    top: var(--cropper-y1);
    left: var(--cropper-x1);
    width: calc(var(--cropper-x2) - var(--cropper-x1));
    height: calc(var(--cropper-y2) - var(--cropper-y1));
    cursor: grab;

    &.grabbing {
      cursor: grabbing;
    }
  }

  .cropper-border {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    fill: none;
    stroke: black;
    stroke-width: 2px;

    .cropper-border-white {
      stroke: white;
      stroke-dasharray: 6 6;
      animation: border-spiner 0.5s linear infinite;
    }
  }

  .cropper-handle {
    position: absolute;
    width: var(--handle-size);
    height: var(--handle-size);
    margin-top: calc(var(--handle-size) / -2);
    margin-left: calc(var(--handle-size) / -2);
    background-color: var(--handle-color);
    border-radius: 50%;
    border: 1px solid #fff;
  }

  .cropper-mask {
    position: absolute;
    background-color: var(--mask-bg-color);
    cursor: crosshair;
  }

  .cropper-info {
    position: absolute;
    top: 100%;
    left: 50%;
    padding: 2px 5px;
    transform: translate(-50%, 5px);
    font-size: 12px;
    white-space: nowrap;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 3px;
    opacity: 0;
    transition: opacity .3s;

    &.show {
      opacity: 1;
    }
  }

  .handle-n,
  .handle-nw,
  .handle-ne {
    top: 0;
  }

  .handle-s,
  .handle-sw,
  .handle-se {
    top: 100%;
  }

  .handle-w,
  .handle-nw,
  .handle-sw {
    left: 0;
  }

  .handle-e,
  .handle-ne,
  .handle-se {
    left: 100%;
  }

  .handle-n,
  .handle-s {
    left: 50%;
  }

  .handle-w,
  .handle-e {
    top: 50%;
  }

  .handle-n,
  .handle-s {
    cursor: row-resize;
  }

  .handle-e,
  .handle-w {
    cursor: col-resize;
  }

  .handle-nw,
  .handle-se {
    cursor: nwse-resize;
  }

  .handle-ne,
  .handle-sw {
    cursor: nesw-resize;
  }

  .mask-left {
    top: 0;
    left: 0;
    width: var(--cropper-x1);
    height: 100%;
  }

  .mask-top {
    top: 0;
    left: var(--cropper-x1);
    width: calc(var(--cropper-x2) - var(--cropper-x1));
    height: var(--cropper-y1);
  }

  .mask-bottom {
    top: var(--cropper-y2);
    left: var(--cropper-x1);
    width: calc(var(--cropper-x2) - var(--cropper-x1));
    height: calc(100% - var(--cropper-y2));
  }

  .mask-right {
    top: 0;
    left: var(--cropper-x2);
    width: calc(100% - var(--cropper-x2));
    height: 100%;
  }
</style>
