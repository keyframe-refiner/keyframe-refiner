// TODO: rewrite worker scripts in TypeScript

importScripts('./opencv-4.5.3.js');

self.config = null;

self.debug = false;

self.ready = new Promise(resolve => {
  cv.onRuntimeInitialized = resolve;
});

/**
 * Default handler that is called when the main page requests the position of the pivot point
 *
 * @param {cv.Mat}  image input image
 * @param {cv.Rect} ROI   region of interest
 *
 * @return {cv.Point}     the pivot point
 */
function onRequestPivot(image, ROI) {
  return new cv.Point();
}

/**
 * Default handler that is called when the main page requests to process an image
 *
 * @param {cv.Mat}   image    input image
 * @param {cv.Mat}   refImage reference image
 * @param {cv.Rect}  ROI      region of interest
 * @param {cv.Point} pivot    pivot point
 *
 * @return {cv.Mat}           the result
 */
function onRequestProcessing(image, refImage, ROI, pivot) {
  return image.clone();
}

function createImageMat(imageBuffer) {
  const { width, height, buffer } = imageBuffer;

  const mat = new cv.Mat(height, width, cv.CV_8UC4);
  mat.data.set(new Uint8ClampedArray(buffer));

  return mat;
}

function respond(evt, { result, error, transfer } = {}) {
  self.postMessage({
    respondTo: evt.data.request,
    id: evt.data.id,
    error,
    result,
  }, transfer);
}

function handleError(evt, error) {
  console.error('[worker]', error);

  respond(evt, {
    error: error.message,
  });
}

async function pong(evt) {
  await ready;
  self.debug = evt.data.body.debug;
  respond(evt);
}

async function requestPivot(evt) {
  const { mode, image, ROI } = evt.data.body;
  const mat = createImageMat(image);
  const ROIrect = new cv.Rect(ROI.x, ROI.y, ROI.width, ROI.height);

  try {
    const pivot = await self.onRequestPivot(mode, mat, ROIrect);

    respond(evt, {
      result: {
        pivot,
      },
    });
  } catch (e) {
    handleError(evt, e);
  } finally {
    mat.delete();
  }
}

async function requestProcessing(evt) {
  const { mode, refImage, ROI, pivot } = config;

  const mat = createImageMat(evt.data.body.image);

  try {
    const result = await self.onRequestProcessing(mode, mat, refImage, ROI, pivot);
    const { buffer } = new Uint8ClampedArray(result.data);

    respond(evt, {
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
    handleError(evt, e);
  } finally {
    mat.delete();
  }
}

function setConfig(evt) {
  const { mode, refImage, ROI, pivot } = evt.data.body.config;

  self.config = {
    mode,
    refImage: createImageMat(refImage),
    pivot: new cv.Point(pivot.x, pivot.y),
    ROI: new cv.Rect(ROI.x, ROI.y, ROI.width, ROI.height),
  };

  respond(evt);
}

function clean(evt) {
  self.config.refImage.delete();
  self.config = null;
  respond(evt);
}

self.addEventListener('message', async (evt) => {
  switch (evt.data?.request) {
    case 'ping':
      await pong(evt);
      break;

    case 'set-config':
      setConfig(evt);
      break;

    case 'clean':
      clean(evt);
      break;

    case 'request-pivot':
      await requestPivot(evt);
      break;

    case 'request-processing':
      await requestProcessing(evt);
      break;

    default:
      console.warn('[worker] unknown message', evt);
      break;
  }
});
