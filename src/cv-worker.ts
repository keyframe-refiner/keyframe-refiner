import { Defer } from './utils/defer';
import { Point } from './record-factory';
import { ImageCanvas } from './image-canvas';
import type { Rect } from './record-factory';

export class CVWorker {
  readonly #workers: Worker[];
  readonly #readyDefer = new Defer<null>();
  readonly ready = this.#readyDefer.promise;

  #messageID = 0;

  constructor(scriptURL: string, workerCount = 4) {
    this.#workers = [];

    for (let i = 0; i < workerCount; i++) {
      this.#workers.push(new Worker(scriptURL));
    }

    this.#handshake();
  }

  async requestPivot(image: ImageCanvas, ROI: Rect) {
    const imageData = image.getImageData();

    const result = await this.#sendOnce(
      this.#workers[0],
      'request-pivot',
      {
        image: {
          width: imageData.width,
          height: imageData.height,
          buffer: imageData.data.buffer,
        },
        ROI: {
          x: ROI.x1,
          y: ROI.y1,
          width: ROI.width,
          height: ROI.height,
        },
      },
      [imageData.data.buffer],
    );

    return new Point({
      x: Math.round(result.x),
      y: Math.round(result.y),
    });
  }

  async requestProcessing(
    inputs: ImageCanvas[],
    refImage: ImageCanvas,
    ROI: Rect,
    pivot: Point,
    onProcessed: (index: number, result: ImageCanvas | Error, progress: number) => void,
  ) {
    const total = inputs.length;
    const sliceSize = Math.ceil(total / this.#workers.length);
    let finished = 0;

    const deferred = new Defer<null>();

    const pivotPoint = {
      x: pivot.x,
      y: pivot.y,
    };

    const ROIrect = {
      x: ROI.x1,
      y: ROI.y1,
      width: ROI.width,
      height: ROI.height,
    };

    const refImageBuffer = this.#createImageBuffer(refImage.getImageData());

    const removeListeners = this.#workers.map((worker, index) => {
      const start = index * sliceSize;
      const end = start + sliceSize;

      if (start >= total) {
        return null;
      }

      const buffers: ArrayBuffer[] = [];

      const images = inputs.slice(start, end).map((image, idx) => {
        const imageData = image.getImageData();

        buffers.push(imageData.data.buffer);

        return {
          index: idx + start,
          image: this.#createImageBuffer(imageData),
        };
      });

      const body = {
        images,
        refImage: refImageBuffer,
        ROI: ROIrect,
        pivot: pivotPoint,
      };

      return this.#send(worker, 'request-processing', body, buffers, async (e) => {
        if (e.data.error) {
          onProcessed(
            e.data.result.index,
            new Error(e.data.error),
            (finished + 1) / total,
          );
        } else {
          const { index, image } = e.data.result;
          const { filename, filetype } = inputs[index];
          const canvas = this.#arrayBufferToCanvas(image.buffer, image.width, image.height);

          onProcessed(
            index,
            await ImageCanvas.fromCanvas(canvas, filename.replace(/(?=\.\w+$)/, '_out'), filetype),
            (finished + 1) / total,
          );
        }

        // update finished count later to avoid racing
        finished++;

        if (finished === total) {
          deferred.resolve(null);
          removeListeners.forEach(fn => fn?.());
        }
      });
    });

    return deferred.promise;
  }

  async #handshake() {
    await Promise.all(this.#workers.map(w => this.#sendOnce(w, 'ping')));

    this.#readyDefer.resolve(null);
  }

  async #sendOnce(worker: Worker, request: string, body?: any, transfer?: Transferable[]) {
    const defer = new Defer<any>();

    const removeListener = this.#send(worker, request, body, transfer, (e) => {
      if (e.data.error) {
        defer.reject(new Error(e.data.error));
      } else {
        defer.resolve(e.data.result);
      }

      removeListener();
    });

    return defer.promise;
  }

  #send(
    worker: Worker,
    request: string,
    body?: any,
    transfer?: Transferable[],
    callback?: (e: MessageEvent) => void,
  ) {
    const id = this.#messageID;
    this.#messageID++;

    function handler(e: MessageEvent) {
      if (e.data.respondTo === request && e.data.id === id) {
        callback?.(e);
      }
    }

    worker.addEventListener('message', handler);

    worker.postMessage({
      ...body,
      request,
      id,
    }, transfer || []);

    return () => worker.removeEventListener('message', handler);
  }

  #createImageBuffer(imageData: ImageData) {
    return {
      width: imageData.width,
      height: imageData.height,
      buffer: imageData.data.buffer,
    };
  }

  #arrayBufferToCanvas(buffer: ArrayBuffer, width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;

    const imageData = new ImageData(
      new Uint8ClampedArray(buffer),
      width, height,
    );

    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }
}
