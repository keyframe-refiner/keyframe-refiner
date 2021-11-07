import { afterUpdate } from 'svelte';

export class VariableTracker {
  readonly #varGetter: () => any[];
  #lastVars?: any[];

  #changed: boolean = false;

  constructor(varGetter: () => any[]) {
    this.#varGetter = varGetter;

    afterUpdate(() => {
      this.#changed = this.#check();
    });
  }

  #check() {
    if (!this.#lastVars) {
      this.#lastVars = this.#varGetter();
      return true;
    }

    const vars = this.#varGetter();
    const result = this.#lastVars.some((v, i) => v !== vars[i]);

    this.#lastVars = vars;

    return result;
  }

  stale() {
    // FIXME: this is a hack to force a re-render
    return this.#changed || this.#check(); // check again after update
  }
}
