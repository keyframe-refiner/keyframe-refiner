import { onDestroy } from 'svelte';

export class VariableTracker {
  #lastVars: any[] | null;
  #varGetter: () => any[] | null;

  constructor(varGetter: () => any[]) {
    this.#varGetter = varGetter;

    onDestroy(() => {
      this.#lastVars = null;
      this.#lastVars = null;
    });
  }

  stale() {
    if (!this.#lastVars) {
      this.#lastVars = this.#varGetter();
      return true;
    }

    const vars = this.#varGetter();
    const result = this.#lastVars?.some((v, i) => v !== vars?.[i]);

    this.#lastVars = vars;

    return result;
  }
}
