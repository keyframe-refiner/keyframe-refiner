importScripts('./cv-runner.js');

function convertToBinary(img, ROI) {
  const cutImg = img.roi(ROI);
  const bwImg = new cv.Mat();
  cv.medianBlur(cutImg, bwImg, 5);
  cv.cvtColor(cutImg, bwImg, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(bwImg, bwImg, 100, 255, cv.THRESH_BINARY_INV);

  cutImg.delete();

  return bwImg;
}

function findPolygons(img, ROI, minArea = 100, topN = 2) {
  const bwImg = convertToBinary(img, ROI);

  // find contours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.findContours(bwImg, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  const polygons = [];

  for (let i = 0; i < contours.size(); ++i) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    const arcLength = cv.arcLength(contour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(contour, approx, 0.02 * arcLength, true);

    if (approx.rows >= 4 && approx.rows <= 10 && area > minArea) {
      const polygon = new cv.Mat();
      cv.approxPolyDP(contour, polygon, 3, true);

      const rect = cv.boundingRect(polygon);

      polygons.push({
        area,
        center: new cv.Point(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
        ),
      });

      // draw contour and bounding rect
      // cv.drawContours(img, contours, i, [0, 255, 0, 255], 2, cv.LINE_8, hierarchy, 0);
      // cv.rectangle(
      //   img,
      //   new cv.Point(rect.x, rect.y),
      //   new cv.Point(rect.x + rect.width, rect.y + rect.height),
      //   [0, 0, 255, 255],
      //   2,
      // );

      polygon.delete();
    }

    contour.delete();
    approx.delete();
  }

  contours.delete();
  hierarchy.delete();
  bwImg.delete();

  // sort polygons by area...
  polygons.sort((a, b) => b.area - a.area);

  // ...then pick the top N...
  const result = polygons.slice(0, topN);

  // ...and sort them by their center's x coordinate
  result.sort((a, b) => a.center.x - b.center.x);

  return result;
}

function calcRotation(img, ROI) {
  const polygons = findPolygons(img, ROI);

  if (polygons.length < 2) {
    throw new Error('タップ穴を検出できませんでした');
  }

  const { center: c1 } = polygons[0];
  const { center: c2 } = polygons[1];

  const center = new cv.Point(
    Math.round((c1.x + c2.x) / 2),
    Math.round((c1.y + c2.y) / 2),
  );

  // draw c1 and c2
  // cv.circle(img, c1, 10, [0, 255, 255, 255], 2);
  // cv.circle(img, c2, 10, [0, 255, 255, 255], 2);

  const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x) * 180 / Math.PI;

  return { center, angle };
}

function translate(img, tx, ty, size) {
  const M = cv.matFromArray(
    2, 3, cv.CV_32F,
    [1, 0, tx,
      0, 1, ty],
  );

  cv.warpAffine(
    img, img, M, size,
    cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255),
  );

  M.delete();
}

function rotate(img, center, angle, size) {
  const M = cv.getRotationMatrix2D(center, angle, 1);

  cv.warpAffine(
    img, img, M, size,
    cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255),
  );

  M.delete();
}

function getPivot(image, ROI) {
  const { center } = calcRotation(image, ROI);

  return { ...center };
}

function refine(image, refImage, ROI, pivot) {
  const result = new cv.Mat();
  image.copyTo(result);

  const { center, angle } = calcRotation(result, ROI);
  const size = {
    width: refImage.cols,
    height: refImage.rows,
  };

  translate(result, pivot.x - center.x, pivot.y - center.y, size);
  rotate(result, center, angle, size);

  return result;
}

self.onRequestPivot = getPivot;
self.onRequestProcessing = refine;
