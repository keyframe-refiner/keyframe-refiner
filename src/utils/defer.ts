export class Defer<T> {
  promise: Promise<T>;
  resolve: (result: T) => void;
  reject: (reason: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
