import clamp from 'lodash-es/clamp';
import Scrollbar, { ScrollbarPlugin } from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';

type Delta = {
  x: number,
  y: number,
}

class DisableKeyboardPlugin extends ScrollbarPlugin {
  static pluginName = 'disableKeyboard';

  transformDelta(delta: Delta, fromEvent: Event) {
    if (fromEvent.type.startsWith('key')) {
      return { x: 0, y: 0 };
    }

    return delta;
  }
}

class PreventZoomScrollingPlugin extends ScrollbarPlugin {
  static pluginName = 'preventZoomScrolling';

  transformDelta(delta: Delta, fromEvent: Event) {
    if (fromEvent.type.match(/wheel/) && (fromEvent as WheelEvent).ctrlKey) {
      return { x: 0, y: 0 };
    }

    return delta;
  }
}

// adapted from https://github.com/idiotWu/smooth-scrollbar/blob/develop/src/events/select.ts
class PannablePlugin extends ScrollbarPlugin {
  static pluginName = 'pannable';

  #xAxisTrackHeight: number;
  #yAxisTrackWidth: number;

  #onPanMove = (e: CustomEvent) => {
    const { offset, limit } = this.scrollbar;
    const { top, right, bottom, left } = this.scrollbar.bounding;
    const pointerX: number = e.detail.pointerX;
    const pointerY: number = e.detail.pointerY;

    let deltaX = 0;
    let deltaY = 0;

    let rightOffset = 0;
    let bottomOffset = 0;

    if (this.scrollbar.options.alwaysShowTracks) {
      rightOffset = this.#yAxisTrackWidth;
      bottomOffset = this.#xAxisTrackHeight;
    }

    if (pointerX >= right - rightOffset) {
      deltaX = 10;
    } else if (pointerX <= left) {
      deltaX = -10;
    }

    if (pointerY >= bottom - bottomOffset) {
      deltaY = 10;
    } else if (pointerY <= top) {
      deltaY = -10;
    }

    this.scrollbar.setMomentum(
      clamp(offset.x + deltaX, 0, limit.x) - offset.x,
      clamp(offset.y + deltaY, 0, limit.y) - offset.y,
    );
  }

  onInit() {
    this.scrollbar.containerEl.addEventListener('pan-move', this.#onPanMove);
  }

  onUpdate() {
    this.#yAxisTrackWidth = this.scrollbar.track.yAxis.element.clientWidth;
    this.#xAxisTrackHeight = this.scrollbar.track.xAxis.element.clientHeight;
  }

  onDestroy() {
    this.scrollbar.containerEl.removeEventListener('pan-move', this.#onPanMove);
  }
}

Scrollbar.use(DisableKeyboardPlugin, PreventZoomScrollingPlugin, PannablePlugin, OverscrollPlugin);

(window as any).Scrollbar = Scrollbar;
