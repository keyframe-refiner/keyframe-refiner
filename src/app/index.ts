import './scrollbar-plugins';
import App from './App.svelte';

// register service worker
if (!__DEV_MODE__ && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js');
}

export default new App({
  target: document.body,
});
