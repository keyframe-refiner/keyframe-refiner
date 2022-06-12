import { writable } from 'svelte/store';

export function createSignal() {
  const activated = writable(false);

  let _resolve: (confirmed: boolean) => void;

  return {
    activated,

    // activate signal
    init() {
      activated.set(true);

      return new Promise<boolean>((resolve) => {
        _resolve = resolve;
      });
    },

    // confirm signal
    ok() {
      activated.set(false);
      _resolve(true);
    },

    // cancel signal
    cancel() {
      activated.set(false);
      _resolve(false);
    },
  };
}
