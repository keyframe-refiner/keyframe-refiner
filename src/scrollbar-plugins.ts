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
class DragPlugin extends ScrollbarPlugin {
  static pluginName = 'drag';

  #animationID: number;
  #started: boolean;

  #onDragstart = (e: DragEvent) => {
    e.stopPropagation();
    cancelAnimationFrame(this.#animationID);
    this.#started = true;
  }

  #onPointerMove = (e: PointerEvent) => {
    if (!this.#started) {
      return;
    }

    cancelAnimationFrame(this.#animationID);

    const delta = this.#calcDelta(e);
    this.#scroll(delta);
  }

  #onPointerUp = () => {
    cancelAnimationFrame(this.#animationID);
    this.#started = false;
  }

  onInit() {
    const { containerEl } = this.scrollbar;

    containerEl.addEventListener('dragstart', this.#onDragstart);
    window.addEventListener('pointermove', this.#onPointerMove);
    window.addEventListener('pointerup', this.#onPointerUp);
    window.addEventListener('blur', this.#onPointerUp);
  }

  onDestroy() {
    cancelAnimationFrame(this.#animationID);

    const { containerEl } = this.scrollbar;

    containerEl.removeEventListener('dragstart', this.#onDragstart);
    window.removeEventListener('pointermove', this.#onPointerMove);
    window.removeEventListener('pointerup', this.#onPointerUp);
    window.removeEventListener('blur', this.#onPointerUp);
  }

  #scroll({ x, y }) {
    if (!x && !y) return;

    const { offset, limit } = this.scrollbar;

    this.scrollbar.setMomentum(
      clamp(offset.x + x, 0, limit.x) - offset.x,
      clamp(offset.y + y, 0, limit.y) - offset.y,
    );

    this.#animationID = requestAnimationFrame(() => {
      this.#scroll({ x, y });
    });
  }

  #calcDelta(e: PointerEvent) {
    const { top, right, bottom, left } = this.scrollbar.bounding;
    const x = e.clientX;
    const y = e.clientY;

    const delta = {
      x: 0,
      y: 0,
    };

    if (x > right) {
      delta.x = 10;
    } else if (x < left) {
      delta.x = -10;
    }

    if (y > bottom) {
      delta.y = 10;
    } else if (y < top) {
      delta.y = -10;
    }

    return delta;
  }
}

Scrollbar.use(DisableKeyboardPlugin, PreventZoomScrollingPlugin, DragPlugin, OverscrollPlugin);
