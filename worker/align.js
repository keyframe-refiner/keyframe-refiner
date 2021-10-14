importScripts('worker/cv-runner.js');

function convertImageToGray(img) {
  const dst = new cv.Mat();
  cv.cvtColor(img, dst, cv.COLOR_RGBA2GRAY, 0);
  return dst;
}

function checkCircle(img) {
  const dst = new cv.Mat();
  cv.medianBlur(img, dst, 5);
  const circles = new cv.Mat();
  cv.HoughCircles(dst, circles, cv.HOUGH_GRADIENT, 1, 20, 50, 30, 0, 0);

  let center;

  try {
    if (circles.cols !== 1) {
      throw new Error('画像に円が 2 つ以上あります');
    }

    const x = circles.data32F[0];
    const y = circles.data32F[1];
    const r = circles.data32F[2];
    center = new cv.Point(x, y);
    cv.circle(dst, center, r, new cv.Scalar(0, 255, 0, 255), cv.FILLED);
  } finally {
    dst.delete();
    circles.delete();
  }

  return center;
}

self.onRequestPivot = async function onRequestPivot(image, ROI) {
  const cutImg = image.roi(ROI);
  const grayImg = convertImageToGray(cutImg);

  const center = checkCircle(grayImg);

  grayImg.delete();
  cutImg.delete();

  return { ...center };
};

// TODO: change refImage to { width, height } object
self.onRequestProcessing = async function onRequestProcessing(image, refImage, ROI, pivot) {
  const cutImg = image.roi(ROI);
  const grayImg = convertImageToGray(cutImg);

  const center = checkCircle(grayImg);

  const shiftedImg = new cv.Mat();

  // 位置合わせ処理
  const M = cv.matFromArray(
    2, 3, cv.CV_32F,
    [1, 0, pivot.x - center.x,
      0, 1, pivot.y - center.y],
  );

  // 基準画像に合わせて平行移動
  cv.warpAffine(image, shiftedImg, M, {
    width: refImage.cols,
    height: refImage.rows,
  });

  cutImg.delete();
  grayImg.delete();

  return shiftedImg;
};
