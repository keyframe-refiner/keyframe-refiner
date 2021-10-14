importScripts('worker/opencv-4.5.3.js');

function createImageMat(image) {
  const { width, height, buffer } = image;

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
    const result = self.onRequestPivot ? await self.onRequestPivot(mat, ROIrect) : { x: 0, y: 0 };

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
    if (!self.onRequestProcessing) {
      self.postMessage({
        respondTo: evt.data.request,
        id: evt.data.id,
        result: {
          index,
          image,
        },
      }, [image.buffer]);
    } else {
      try {
        const mat = createImageMat(image);
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

        mat.delete();
        result.delete();
      } catch (e) {
        console.error(e);

        self.postMessage({
          respondTo: evt.data.request,
          id: evt.data.id,
          error: e.message,
          result: {
            index,
          },
        });
      }
    }
  }

  refImage.delete();
}

self.addEventListener('message', async (evt) => {
  console.log('[worker]: ', evt);

  if (!evt?.data?.request) {
    console.log('unknow message', evt);
    return;
  }

  switch (evt.data.request) {
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
  }
});
