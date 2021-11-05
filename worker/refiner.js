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

function findPolygons(img, ROI, minArea = 100, minExtent = 0.75, topN = HOLE_COUNT) {
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

    if (approx.rows >= 4 && area > minArea) {
      const rect = cv.minAreaRect(approx);
      const { width, height } = rect.size;
      const extent = area / (width * height);

      if (extent < minExtent) {
        continue;
      }

      polygons.push({
        area,
        extent,
        center: new cv.Point(
          ROI.x + rect.center.x,
          ROI.y + rect.center.y,
        ),
        angle: width < height ? rect.angle - 90 : rect.angle,
      });

      if (self.debug) {
        // draw rotated rect
        const vertices = cv.RotatedRect.points(rect);

        for (const v of vertices) {
          v.x += ROI.x;
          v.y += ROI.y;
        }

        for (let i = 0; i < 4; i++) {
          cv.line(img, vertices[i], vertices[(i + 1) % 4], [0, 0, 255, 255], 3, cv.LINE_AA, 0);
        }
      }
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

function pegHoleRotation(img, ROI) {
  const polygons = findPolygons(img, ROI);

  if (polygons.length < HOLE_COUNT) {
    throw new Error('タップ穴を検出できませんでした');
  }

  const { center: c1 } = polygons[0];
  const { center: c2 } = polygons[1];

  // use the circular hole (the middle one) as pivot
  const center = new cv.Point(c2.x, c2.y);

  if (self.debug) {
    // draw centroids
    polygons.forEach(({ center }) => {
      cv.circle(img, center, 10, [255, 0, 0, 255], -1);
    });
  }

  const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x) * 180 / Math.PI;

  return { center, angle };
}

function frameRotation(img, ROI) {
  const imgSize = img.cols * img.rows;

  const frame = findPolygons(img, ROI, imgSize * 0.5, 0, 1)[0];

  if (!frame) {
    throw new Error('フレームを検出できませんでした');
  }

  if (self.debug) {
    // draw centroids
    cv.circle(img, frame.center, 10, [255, 0, 0, 255], -1);
  }

  return {
    center: frame.center,
    angle: frame.angle,
  };
}

function calcRotation(mode, img, ROI) {
  return mode === 'PEG_HOLE' ? pegHoleRotation(img, ROI) : frameRotation(img, ROI);
}

function getPivot(mode, image, ROI) {
  const { center } = calcRotation(mode, image, ROI);

  return { ...center };
}

function refine(mode, image, refImage, ROI, pivot) {
  const size = {
    width: refImage.cols,
    height: refImage.rows,
  };

  const padded = new cv.Mat();

  // add padding to image to fit the reference image
  cv.copyMakeBorder(
    image, padded,
    0, Math.max(0, size.height - image.rows),
    0, Math.max(0, size.width - image.cols),
    cv.BORDER_CONSTANT,
    [255, 255, 255, 255],
  );

  const { center, angle } = calcRotation(mode, padded, ROI);

  // M = T*R
  // get the rotation matrix R
  const M = cv.getRotationMatrix2D(center, angle, 1);
  // apply translation T
  M.data64F[2] += pivot.x - center.x;
  M.data64F[5] += pivot.y - center.y;

  const result = new cv.Mat();

  cv.warpAffine(
    padded, result, M, size,
    cv.INTER_LINEAR, cv.BORDER_CONSTANT, [255, 255, 255, 255],
  );

  // clear
  M.delete();
  padded.delete();

  return result;
}

self.onRequestPivot = getPivot;
self.onRequestProcessing = refine;
