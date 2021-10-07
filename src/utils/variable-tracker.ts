export class VariableTracker {
  #lastVars: any[] | undefined;
  #varGetter: () => any[];

  constructor(varGetter: () => any[]) {
    this.#varGetter = varGetter;
  }

  stale() {
    if (!this.#lastVars) {
      this.#lastVars = this.#varGetter();
      return true;
    }

    const vars = this.#varGetter();
    const result = this.#lastVars.some((v, i) => v !== vars[i]);

    this.#lastVars = vars;

    return result;
  }
}
