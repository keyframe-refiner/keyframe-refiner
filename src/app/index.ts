import './scrollbar-plugins';
import App from './App.svelte';

// register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(
    new URL('./sw.js', import.meta.url),
  );
}

export default new App({
  target: document.body,
});
