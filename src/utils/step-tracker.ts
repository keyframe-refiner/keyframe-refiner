import { writable } from 'svelte/store';
import type { Writable, Subscriber, Updater } from 'svelte/store';
import type { List } from 'immutable';

export class StepTracker<T> implements Writable<T> {
  readonly #currentStepStore: Writable<T> = writable();

  #allSteps: List<T>;
  #currentIndex: number;

  constructor(allSteps: List<T>, currentStep: T = allSteps.first()!) {
    this.setAllSteps(allSteps, false);
    this.set(currentStep);
  }

  set(currentStep: T) {
    const index = this.#allSteps.indexOf(currentStep);

    if (index === -1) {
      throw new Error(`${currentStep} is not found in ${this.#allSteps.toString()}`);
    }

    this.#currentIndex = index;
    this.#currentStepStore.set(currentStep);
  }

  subscribe(fn: Subscriber<T>) {
    return this.#currentStepStore.subscribe(fn);
  }

  update(fn: Updater<T>) {
    return this.#currentStepStore.update(fn);
  }

  getAllSteps() {
    return this.#allSteps;
  }

  setAllSteps(allSteps: List<T>, resetCurrentStep = true) {
    if (allSteps.size === 0) {
      throw new Error('all-step list is empty');
    }

    this.#allSteps = allSteps;

    if (resetCurrentStep) {
      this.reset();
    }
  }

  getIndex() {
    return this.#currentIndex;
  }

  forward() {
    if (this.#currentIndex === this.#allSteps.size - 1) {
      return;
    }

    this.#currentIndex += 1;
    this.#currentStepStore.set(this.#allSteps.get(this.#currentIndex)!);
  }

  backward() {
    if (this.#currentIndex === 0) {
      return;
    }

    this.#currentIndex -= 1;
    this.#currentStepStore.set(this.#allSteps.get(this.#currentIndex)!);
  }

  activated(step: T) {
    const idx = this.#allSteps.indexOf(step);

    return idx !== -1 && idx <= this.#currentIndex;
  }

  hasFinished(step: T) {
    const idx = this.#allSteps.indexOf(step);

    return idx !== -1 && idx < this.#currentIndex;
  }

  reset() {
    this.#currentIndex = 0;
    this.#currentStepStore.set(this.#allSteps.first()!);
  }
}

