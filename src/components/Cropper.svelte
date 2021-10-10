<script lang="ts">
  import clamp from 'lodash-es/clamp';
  import { getContext, hasContext, onMount } from 'svelte';
  import type Scrollbar from 'smooth-scrollbar';

  import { defaultTransformer } from '../utils/coord-transformer';
  import { Point, Rect } from '../record-factory';

  export let cropRect = new Rect();
  $: localRect = realRectToLocalRect(cropRect);

  export let localToReal = defaultTransformer;
  export let realToLocal = defaultTransformer;

  function localRectToRealRect(localRect: Rect) {
    const x1y1 = localToReal(localRect.x1y1);
    const x2y2 = localToReal(localRect.x2y2);

    return x1y1.formRectWith(x2y2);
  }

  function realRectToLocalRect(realRect: Rect) {
    const x1y1 = realToLocal(realRect.x1y1);
    const x2y2 = realToLocal(realRect.x2y2);

    return x1y1.formRectWith(x2y2);
  }

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

  let pointerPosition = new Point();

  // offsets from pointer to the four points of crop rect
  let pointerOffset = new Rect();

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
    // HACK: enable scrollbar auto-scrolling
    container.dispatchEvent(new CustomEvent('pan-move', {
      bubbles: true,
      detail: {
        pointerX: pointerPosition.x,
        pointerY: pointerPosition.y,
      },
    }));
  }

  function updateAll() {
    const bounding = container.getBoundingClientRect();

    const px = pointerPosition.x - bounding.left;
    const py = pointerPosition.y - bounding.top;

    const x1 = clamp(px - pointerOffset.x1, 0, bounding.width - localRect.width);
    const y1 = clamp(py - pointerOffset.y1, 0, bounding.height - localRect.height);
    const x2 = x1 + localRect.width;
    const y2 = y1 + localRect.height;

    cropRect = localRectToRealRect(new Rect({ x1, y1, x2, y2 }));

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

    const lx = clamp(pointerPosition.x - bounding.left, 0, bounding.width);
    const ly = clamp(pointerPosition.y - bounding.top, 0, bounding.height);

    let { x1, y1, x2, y2 } = localRect;

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

    // manually update cropRect => component updates => auto update localRect (subscription)
    cropRect = localRectToRealRect(new Rect({ x1, y1, x2, y2 }));

    dispatchEvent();
  }

  function onPointerDown(dir: Direction) {
    return (e: PointerEvent) => {
      e.stopPropagation();

      cropping = true;
      direction = dir;

      pointerPosition = new Point({
        x: e.clientX,
        y: e.clientY,
      });

      if (dir === Direction.ALL) {
        const bounding = container.getBoundingClientRect();
        const px = e.clientX - bounding.left;
        const py = e.clientY - bounding.top;

        pointerOffset = new Rect({
          x1: px - localRect.x1,
          y1: py - localRect.y1,
          x2: px - localRect.x2,
          y2: py - localRect.y2,
        });
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

    pointerPosition = new Point({
      x: e.clientX,
      y: e.clientY,
    });

    update();
  }

  function startNew(e: PointerEvent) {
    cropping = true;
    direction = Direction.NW;

    const bounding = container.getBoundingClientRect();
    const px = e.clientX - bounding.left;
    const py = e.clientY - bounding.top;

    pointerPosition = new Point({
      x: e.clientX,
      y: e.clientY,
    });

    cropRect = localRectToRealRect(new Rect({
      x1: px,
      y1: py,
      x2: px,
      y2: py,
    }));
  }
</script>

<div
  class="cropper"
  bind:this={container}
  style={`
    --cropper-x1: ${localRect.x1}px;
    --cropper-y1: ${localRect.y1}px;
    --cropper-x2: ${localRect.x2}px;
    --cropper-y2: ${localRect.y2}px;
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
      {localRect.width} x {localRect.height}
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
    top: 0;
    left: 0;
    width: calc(var(--cropper-x2) - var(--cropper-x1));
    height: calc(var(--cropper-y2) - var(--cropper-y1));
    cursor: grab;
    transform: translate3d(var(--cropper-x1), var(--cropper-y1), 0);

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
    background-color: var(--handle-color);
    border-radius: 50%;
    border: 1px solid #fff;
    transform: translate(-50%, -50%);
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
    width: var(--cropper-x1);
    height: 100%;
    transform: translate3d(0, 0, 0);
  }

  .mask-top {
    width: calc(var(--cropper-x2) - var(--cropper-x1));
    height: var(--cropper-y1);
    transform: translate3d(var(--cropper-x1), 0, 0);
  }

  .mask-bottom {
    width: calc(var(--cropper-x2) - var(--cropper-x1));
    height: calc(100% - var(--cropper-y2));
    transform: translate3d(var(--cropper-x1), var(--cropper-y2), 0);
  }

  .mask-right {
    width: calc(100% - var(--cropper-x2));
    height: 100%;
    transform: translate3d(var(--cropper-x2), 0, 0);
  }
</style>
