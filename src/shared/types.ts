import type { MODE } from './mode';

export type PivotAsObject = {
  x: number;
  y: number;
};

export type ROIAsObject = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageBuffer = {
  width: number;
  height: number;
  buffer: ArrayBufferLike;
};

export type RequestType =
  'ping' |
  'set-debug' |
  'set-configs' |
  'clean' |
  'request-pivot' |
  'request-processing';

export type RequestBodies = {
  ping: void,
  clean: void,
  'set-debug': {
    debug: boolean;
  },
  'set-configs': {
    configs: {
      mode: MODE,
      fitFrame: boolean,
      refImage: ImageBuffer,
      ROI: ROIAsObject,
      pivot: PivotAsObject,
    },
  },
  'request-pivot': {
    mode: MODE,
    image: ImageBuffer,
    ROI: ROIAsObject,
  },
  'request-processing': {
    image: ImageBuffer,
    filename: string,
  },
};

export type ResponseResults = {
  ping: void,
  clean: void,
  'set-debug': void,
  'set-configs': void,
  'request-pivot': {
    pivot: PivotAsObject,
  },
  'request-processing': {
    image: ImageBuffer,
  },
};

export type RequestMessage<K extends keyof RequestBodies> = {
  id: number;
  request: K;
  body: RequestBodies[K];
};

export type ResponseMessage<K extends keyof ResponseResults> = {
  id: number;
  respondTo: K;
  result?: ResponseResults[K];
  error?: any;
};

export type RequestMessageEvent<K extends keyof RequestBodies> = MessageEvent<RequestMessage<K>>;
export type ResponseMessageEvent<K extends keyof ResponseResults> = MessageEvent<ResponseMessage<K>>;
