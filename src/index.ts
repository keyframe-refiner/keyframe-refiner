import App from './App.svelte';
import Scrollbar, { ScrollbarPlugin } from 'smooth-scrollbar';
import OverscrollPlugin from 'smooth-scrollbar/plugins/overscroll';

class DisableKeyboardPlugin extends ScrollbarPlugin {
  static pluginName = 'disableKeyboard';

  transformDelta(delta: { x: number, y: number }, fromEvent: Event) {
    if (fromEvent.type.startsWith('key')) {
      return { x: 0, y: 0 };
    }

    return delta;
  }
}

Scrollbar.use(DisableKeyboardPlugin, OverscrollPlugin);

export default new App({
  target: document.body,
});
