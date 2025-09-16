import { Defer } from './defer';
import { Point } from './record-factory';
import { ImageCanvas } from './image-canvas';
import type { Rect } from './record-factory';
import type { MODE } from '../constants';
import type {
  RequestType,
  RequestBodies,
  ResponseMessageEvent,
  ResponseResults,
} from '../../shared/types';

function createWorker(scriptURL?: URL | string) {
  if (scriptURL) {
    return new Worker(scriptURL);
  }

  return new Worker(
    /* webpackChunkName: "refiner" */
    new URL('../../worker/refiner.ts', import.meta.url),
  );
}

export class CVWorker {
  readonly #workers: Worker[];
  readonly #readyDefer = new Defer<null>();
  readonly ready = this.#readyDefer.promise;

  #messageID = 0;

  constructor(
    scriptURL?: URL | string,
    debugMode = __DEV_MODE__,
    workerCount = navigator.hardwareConcurrency || 4,
  ) {
    this.#workers = [];

    for (let i = 0; i < workerCount; i++) {
      const worker = createWorker(scriptURL);

      this.#workers.push(worker);

      // TODO: add error handling
      worker.onerror = e => {
        alert(`Worker ${i} error: ${e.message}`);
      };
    }

    this.#handshake()
      .then(() => this.setDebugMode(debugMode));
  }

  async setDebugMode(debugMode: boolean) {
    return this.#broadcast('set-debug', { debug: debugMode });
  }

  async requestPivot(mode: MODE, image: ImageCanvas, ROI: Rect) {
    const imageData = image.getImageData();

    const { pivot } = await this.#sendOnce(
      this.#workers[0],
      'request-pivot',
      {
        mode,
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
      x: pivot.x,
      y: pivot.y,
    });
  }

  async requestProcessing(
    mode: MODE,
    fitFrame: boolean,
    inputs: ImageCanvas[],
    refImage: ImageCanvas,
    ROI: Rect,
    pivot: Point,
    onProcessed: (index: number, result: ImageCanvas | Error, progress: number) => void,
  ) {
    await this.#broadcast('set-configs', {
      configs: {
        mode,
        fitFrame,
        refImage: this.#createImageBuffer(refImage.getImageData()),
        ROI: {
          x: ROI.x1,
          y: ROI.y1,
          width: ROI.width,
          height: ROI.height,
        },
        pivot: {
          x: pivot.x,
          y: pivot.y,
        },
      },
    });

    const deferred = new Defer<null>();
    const total = inputs.length;
    let currentIdx = 0;
    let finished = 0;

    const spawn = async (worker: Worker) => {
      if (currentIdx >= total) {
        return;
      }

      // remember job index
      const jobIndex = currentIdx;
      currentIdx++;

      const imageBuffer = this.#createImageBuffer(inputs[jobIndex].getImageData());

      let result: ImageCanvas | Error;

      // console.log(`---> worker: ${this.#workers.indexOf(worker)}, job: ${jobIndex}`);

      try {
        const { image } = await this.#sendOnce(worker, 'request-processing', {
          image: imageBuffer,
          filename: inputs[jobIndex].filename,
        }, [imageBuffer.buffer]);

        const { filename, filetype, exif } = inputs[jobIndex];

        const imageData = new ImageData(
          new Uint8ClampedArray(image.buffer),
          image.width,
          image.height,
        );

        result = ImageCanvas.fromImageData(
          imageData,
          // filename.replace(/(?=\.\w+$)/, '_out'),
          filename,
          filetype,
          exif,
        );
      } catch (e) {
        console.error('[main]', e);
        result = e;
      }

      finished++;

      // console.log(`<--- worker: ${this.#workers.indexOf(worker)}, job: ${jobIndex}, progress: ${finished}/${total}`);

      onProcessed(jobIndex, result, finished / total);

      if (finished === total) {
        // we are done
        deferred.resolve(null);
      } else if (currentIdx < total) {
        // run next job
        spawn(worker);
      }
    };

    this.#workers.forEach(spawn);

    // clean up when finished
    deferred.promise.then(() => {
      this.#broadcast('clean');
    });

    return deferred.promise;
  }

  async #handshake() {
    try {
      await this.#broadcast('ping');
      this.#readyDefer.resolve(null);
    } catch (e) {
      this.#readyDefer.reject(e);
    }
  }

  async #broadcast<R extends RequestType>(
    request: R,
    body?: RequestBodies[R],
  ) {
    const promises = this.#workers.map(
      worker => this.#sendOnce(worker, request, body),
    );

    return Promise.all(promises);
  }

  async #sendOnce<R extends RequestType>(
    worker: Worker,
    request: R,
    body?: RequestBodies[R],
    transfer?: Transferable[],
  ): Promise<ResponseResults[R]> {
    const defer = new Defer<any>();

    const removeListener = this.#send(worker, request, body, transfer, ({ data }) => {
      if (data.error) {
        defer.reject(new Error(data.error));
      } else {
        defer.resolve(data.result);
      }

      removeListener();
    });

    return defer.promise;
  }

  #send<R extends RequestType>(
    worker: Worker,
    request: R,
    body?: RequestBodies[R],
    transfer?: Transferable[],
    onMessage?: (e: ResponseMessageEvent<R>) => void,
  ) {
    const id = this.#messageID;
    this.#messageID++;

    function handler(e: ResponseMessageEvent<R>) {
      if (e.data.respondTo === request && e.data.id === id) {
        onMessage?.(e);
      }
    }

    worker.addEventListener('message', handler);

    worker.postMessage({
      request,
      id,
      body,
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
}
