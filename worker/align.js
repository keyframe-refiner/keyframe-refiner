importScripts('./cv-runner.js');

function convertImageToGray(img) {
  const dst = new cv.Mat();
  cv.cvtColor(img, dst, cv.COLOR_RGBA2GRAY, 0);
  return dst;
}

function checkCircle(img, ROI) {
  const dst = new cv.Mat();
  cv.medianBlur(img, dst, 5);
  const circles = new cv.Mat();
  cv.HoughCircles(dst, circles, cv.HOUGH_GRADIENT, 1, 20, 50, 30, 0, 0);

  let x, y;

  try {
    if (circles.cols === 0) {
      throw new Error('対象領域内で円を検出できませんでした');
    }

    if (circles.cols > 1) {
      throw new Error('対象領域内で円が 2 つ以上あります');
    }

    x = circles.data32F[0];
    y = circles.data32F[1];
  } finally {
    dst.delete();
    circles.delete();
  }

  return new cv.Point(
    Math.round(x + ROI.x),
    Math.round(y + ROI.y),
  );
}

self.onRequestPivot = async function onRequestPivot(image, ROI) {
  const cutImg = image.roi(ROI);
  const grayImg = convertImageToGray(cutImg);

  const center = checkCircle(grayImg, ROI);

  grayImg.delete();
  cutImg.delete();

  return { ...center };
};

self.onRequestProcessing = async function onRequestProcessing(image, refImage, ROI, pivot) {
  const cutImg = image.roi(ROI);
  const grayImg = convertImageToGray(cutImg);

  const center = checkCircle(grayImg, ROI);

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

  M.delete();
  cutImg.delete();
  grayImg.delete();

  return shiftedImg;
};
