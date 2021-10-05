export class VariableTracker {
  #lastVars: any[] | null;
  #varGetter: () => any[] | null;

  constructor(varGetter: () => any[]) {
    this.#varGetter = varGetter;
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

  destroy() {
    this.#lastVars = null;
    this.#lastVars = null;
  }
}
