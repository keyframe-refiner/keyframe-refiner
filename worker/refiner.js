importScripts('./cv-runner.js');

const HOLE_COUNT = 3;

function convertToBinary(img, ROI) {
  const cutImg = img.roi(ROI);
  const bwImg = new cv.Mat();
  cv.medianBlur(cutImg, bwImg, 5);
  cv.cvtColor(cutImg, bwImg, cv.COLOR_RGBA2GRAY, 0);
  cv.threshold(bwImg, bwImg, 100, 255, cv.THRESH_BINARY_INV);

  cutImg.delete();

  return bwImg;
}

function findPolygons(img, ROI, minArea = 100, topN = HOLE_COUNT) {
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
      const rect = cv.boundingRect(approx);

      polygons.push({
        area,
        center: new cv.Point(
          ROI.x + rect.x + rect.width / 2,
          ROI.y + rect.y + rect.height / 2,
        ),
      });

      // draw bounding rect
      // const rx = rect.x + ROI.x;
      // const ry = rect.y + ROI.y;
      // cv.rectangle(
      //   img,
      //   new cv.Point(rx, ry),
      //   new cv.Point(rx + rect.width, ry + rect.height),
      //   [0, 0, 255, 255],
      //   2,
      // );
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

  if (polygons.length < HOLE_COUNT) {
    throw new Error('タップ穴を検出できませんでした');
  }

  const { center: c1 } = polygons[0];
  const { center: c2 } = polygons[1];

  // use the circular hole (the middle one) as pivot
  const center = new cv.Point(c2.x, c2.y);

  // draw centroids
  // polygons.forEach(({ center }) => {
  //   cv.circle(img, center, 10, [0, 255, 255, 255], 2);
  // });

  const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x) * 180 / Math.PI;

  // console.log(polygons.map(p => [p.center.x, p.center.y]));

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

function rotate(img, pivot, angle, size) {
  const M = cv.getRotationMatrix2D(pivot, angle, 1);

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
  rotate(result, pivot, angle, size);

  return result;
}

self.onRequestPivot = getPivot;
self.onRequestProcessing = refine;
