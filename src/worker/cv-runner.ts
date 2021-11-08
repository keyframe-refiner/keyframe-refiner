import cv from 'opencv-ts';

import type { Mat, Point, Rect } from 'opencv-ts';
import type { MODE } from '../shared/mode';
import type {
  ImageBuffer,
  RequestType,
  RequestMessageEvent,
  ResponseResults,
} from '../shared/types';

export class CVRunner {
  readonly ready = new Promise(resolve => {
    cv.onRuntimeInitialized = () => {
      resolve(null);
    };
  });

  // debug mode
  debug = false;

  // configs
  configs: {
    mode: MODE,
    fitFrame: boolean,
    refImage: Mat,
    pivot: Point,
    ROI: Rect,
  } | null = null;

  constructor() {
    this.handleMessage();
  }

  /**
   * Default handler that is called when the main page requests the position of the pivot point
   *
   * @param mode  detection mode
   * @param image input image
   * @param ROI   region of interest
   *
   * @return the pivot point
   */
  async onRequestPivot(_mode: MODE, _image: Mat, _ROI: Rect): Promise<Point> {
    return new cv.Point(0, 0);
  }

  /**
   * Default handler that is called when the main page requests to process an image
   *
   * @param mode     detection mode
   * @param image    input image
   * @param refImage reference image
   * @param ROI      region of interest
   * @param pivot    pivot point
   *
   * @return the result
   */
  async onRequestProcessing(_mode: MODE, image: Mat, _refImage: Mat, _ROI: Rect, _pivot: Point): Promise<Mat> {
    return image.clone();
  }

  createImageMat(imageBuffer: ImageBuffer) {
    const { width, height, buffer } = imageBuffer;

    const mat = new cv.Mat(height, width, cv.CV_8UC4);
    (mat.data as any).set(new Uint8ClampedArray(buffer));

    return mat;
  }

  async pong(evt: RequestMessageEvent<'ping'>) {
    await this.ready;
    this.respond(evt);
  }

  async requestPivot(evt: RequestMessageEvent<'request-pivot'>) {
    const { mode, image, ROI } = evt.data.body;
    const mat = this.createImageMat(image);
    const ROIrect = new cv.Rect(ROI.x, ROI.y, ROI.width, ROI.height);

    try {
      const pivot = await this.onRequestPivot(mode, mat, ROIrect);

      this.respond(evt, {
        result: {
          pivot,
        },
      });
    } catch (e) {
      this.handleError(evt, e);
    } finally {
      mat.delete();
    }
  }

  async requestProcessing(evt: RequestMessageEvent<'request-processing'>) {
    const { mode, refImage, ROI, pivot } = this.configs!;

    const mat = this.createImageMat(evt.data.body.image);

    try {
      const result = await this.onRequestProcessing(mode, mat, refImage, ROI, pivot);
      const { buffer } = new Uint8ClampedArray(result.data);

      this.respond(evt, {
        result: {
          image: {
            buffer,
            width: result.cols,
            height: result.rows,
          },
        },
        transfer: [buffer],
      });

      result.delete();
    } catch (e) {
      this.handleError(evt, e);
    } finally {
      mat.delete();
    }
  }

  setConfigs(evt: RequestMessageEvent<'set-configs'>) {
    const { mode, fitFrame, refImage, ROI, pivot } = evt.data.body.configs;

    this.configs = {
      mode,
      fitFrame,
      refImage: this.createImageMat(refImage),
      pivot: new cv.Point(pivot.x, pivot.y),
      ROI: new cv.Rect(ROI.x, ROI.y, ROI.width, ROI.height),
    };

    this.respond(evt);
  }

  setDebugMode(evt: RequestMessageEvent<'set-debug'>) {
    this.debug = evt.data.body.debug;
  }

  clean(evt: RequestMessageEvent<'clean'>) {
    this.configs?.refImage.delete();
    this.configs = null;
    this.respond(evt);
  }

  checkConfig() {
    if (!this.configs) {
      throw new Error('[worker] configs not set');
    }
  }

  respond<R extends RequestType>(
    evt: RequestMessageEvent<R>,
    { result, error, transfer } = {} as Partial<{
      result: ResponseResults[R],
      error: any,
      transfer: Transferable[],
    }>,
  ) {
    self.postMessage({
      respondTo: evt.data.request,
      id: evt.data.id,
      error,
      result,
    }, transfer || []);
  }

  handleError(evt: RequestMessageEvent<RequestType>, error: Error) {
    console.error('[worker]', error);

    this.respond(evt, {
      error: error.message,
    });
  }

  handleMessage() {
    self.addEventListener('message', async (evt: MessageEvent) => {
      switch (evt.data?.request) {
        case 'ping':
          await this.pong(evt);
          break;

        case 'set-debug':
          this.setDebugMode(evt);
          break;

        case 'set-configs':
          this.setConfigs(evt);
          break;

        case 'clean':
          this.clean(evt);
          break;

        case 'request-pivot':
          await this.requestPivot(evt);
          break;

        case 'request-processing':
          await this.requestProcessing(evt);
          break;

        default:
          console.warn('[worker] unknown message', evt);
          break;
      }
    });
  }
}
