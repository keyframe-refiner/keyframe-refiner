import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { List } from 'immutable';

export class StepManager<T> {
  readonly currentStep: Writable<T>;
  readonly allSteps: Writable<List<T>>;
  readonly currentIndex: Writable<number>;

  // @ts-ignore
  #currentStepValue: T;
  #allStepsValue: List<T>;
  #currentIndexValue: number;

  constructor(allSteps: List<T>, currentStep: T = allSteps.first()) {
    this.allSteps = writable(allSteps);
    this.currentStep = writable(currentStep);
    this.currentIndex = writable(0);

    this.#allStepsValue = get(this.allSteps);
    this.#currentStepValue = get(this.currentStep);
    this.#currentIndexValue = get(this.currentIndex);

    // bi-di subscription
    this.currentStep.subscribe(current => {
      const index = this.#allStepsValue.indexOf(current);

      if (index === -1) {
        throw new Error(`${current} is not found in ${this.#allStepsValue.toString()}`);
      }

      this.#currentStepValue = current;
      this.currentIndex.set(index);
    });

    this.allSteps.subscribe(steps => {
      if (steps.size === 0) {
        throw new Error('all-step list is empty');
      }

      this.#allStepsValue = steps;
      this.currentIndex.set(0);
    });

    this.currentIndex.subscribe(idx => {
      const step = this.#allStepsValue.get(idx);

      if (step === undefined) {
        throw new Error(`step index ${idx} does not exist on ${this.#allStepsValue.toString()}`);
      }

      this.#currentIndexValue = idx;
      this.currentStep.set(step);
    });
  }

  forward() {
    if (this.#currentIndexValue === this.#allStepsValue.size - 1) {
      return;
    }

    // currentStep will be update automatically
    this.currentIndex.update(i => i + 1);
  }

  backward() {
    if (this.#currentIndexValue === 0) {
      return;
    }

    this.currentIndex.update(i => i - 1);
  }

  reset() {
    this.currentIndex.set(0);
  }

  // check if the steps before the given step has been activated
  activated(step: T) {
    const idx = this.#allStepsValue.indexOf(step);

    return idx !== -1 && idx <= this.#currentIndexValue;
  }

  // check if the given step has finished
  hasFinished(step: T) {
    const idx = this.#allStepsValue.indexOf(step);

    return idx !== -1 && idx < this.#currentIndexValue;
  }
}

