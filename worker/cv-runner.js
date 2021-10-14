// TODO: rewrite worker scripts in TypeScript

importScripts('./opencv-4.5.3.js');

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
  return image;
}

function createImageMat(imageData) {
  const { width, height, buffer } = imageData;

  const mat = new cv.Mat(height, width, cv.CV_8UC4);
  mat.data.set(new Uint8ClampedArray(buffer));

  return mat;
}

self.ready = new Promise(resolve => {
  cv.onRuntimeInitialized = resolve;
});

async function requestPivot(evt) {
  const { image, ROI } = evt.data;
  const mat = createImageMat(image);
  const ROIrect = new cv.Rect(ROI.x, ROI.y, ROI.width, ROI.height);

  try {
    const result = await self.onRequestPivot(mat, ROIrect);

    self.postMessage({
      respondTo: evt.data.request,
      id: evt.data.id,
      result,
    });
  } catch (e) {
    console.error(e);

    self.postMessage({
      respondTo: evt.data.request,
      id: evt.data.id,
      error: e.message,
    });
  } finally {
    mat.delete();
  }
}

async function requestProcessing(evt) {
  const { ROI, pivot } = evt.data;

  const refImage = createImageMat(evt.data.refImage);

  for (const { image, index } of evt.data.images) {
    const mat = createImageMat(image);

    try {
      const ROIrect = new cv.Rect(ROI.x, ROI.y, ROI.width, ROI.height);
      const pivotPoint = new cv.Point(pivot.x, pivot.y);

      const result = await self.onRequestProcessing(mat, refImage, ROIrect, pivotPoint);

      const { buffer } = new Uint8ClampedArray(result.data);

      self.postMessage({
        respondTo: evt.data.request,
        id: evt.data.id,
        result: {
          index,
          image: {
            buffer,
            width: result.cols,
            height: result.rows,
          },
        },
      }, [buffer]);

      result.delete();
    } catch (e) {
      console.error('[worker]', e);

      self.postMessage({
        respondTo: evt.data.request,
        id: evt.data.id,
        error: e.message,
        result: {
          index,
        },
      });
    } finally {
      mat.delete();
    }
  }

  refImage.delete();
}

self.addEventListener('message', async (evt) => {
  switch (evt.data?.request) {
    case 'ping':
      await ready;
      self.postMessage({
        respondTo: evt.data.request,
        id: evt.data.id,
      });
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
