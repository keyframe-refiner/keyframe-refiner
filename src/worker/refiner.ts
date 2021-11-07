import cv from 'opencv-ts';
import { MODE } from '../shared/mode';
import { CVRunner } from './cv-runner';

import type { Mat, Point, Rect, RotatedRect, Size } from 'opencv-ts';

type RotatedRectFixed = RotatedRect & {
  size: Size,
  center: Point,
  angle: number,
};

type Polygon = {
  area: number,
  extent: number,
  angle: number,
  center: Point,
};

const HOLE_COUNT = 3;

class Refiner extends CVRunner {
  findPolygons(
    img: Mat,
    ROI: Rect,
    minArea = 100,
    minExtent = 0.75,
    topN = HOLE_COUNT,
  ) {
    // conver to binary image
    const cutImg = img.roi(ROI);
    const bwImg = new cv.Mat();
    cv.medianBlur(cutImg, bwImg, 5);
    cv.cvtColor(cutImg, bwImg, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(bwImg, bwImg, 100, 255, cv.THRESH_BINARY_INV);

    // find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    cv.findContours(bwImg, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    const polygons: Polygon[] = [];

    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      const arcLength = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * arcLength, true);

      if (approx.rows >= 4 && area > minArea && cv.isContourConvex(approx)) {
        const rect = cv.minAreaRect(approx) as RotatedRectFixed;
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
          angle: width < height ? rect.angle + 90 : rect.angle,
        });

        if (this.debug) {
          // draw contours
          cv.drawContours(cutImg, contours, i, new cv.Scalar(255, 0, 0, 255), 3);

          // draw rotated rect
          const vertices = cv.rotatedRectPoints(rect);

          for (let i = 0; i < 4; i++) {
            cv.line(cutImg, vertices[i], vertices[(i + 1) % 4], new cv.Scalar(0, 0, 255, 255), 3, cv.LINE_AA, 0);
          }
        }
      }

      contour.delete();
      approx.delete();
    }

    contours.delete();
    hierarchy.delete();
    bwImg.delete();
    cutImg.delete();

    // sort polygons by area...
    polygons.sort((a, b) => b.area - a.area);

    // ...then pick the top N...
    const result = polygons.slice(0, topN);

    // ...and sort them by their center's x coordinate
    result.sort((a, b) => a.center.x - b.center.x);

    return result;
  }

  pegHoleRotation(img: Mat, ROI: Rect) {
    const polygons = this.findPolygons(img, ROI);

    if (polygons.length < HOLE_COUNT) {
      throw new Error('タップ穴を検出できませんでした');
    }

    const { center: c1 } = polygons[0];
    const { center: c2 } = polygons[1];

    // use the circular hole (the middle one) as pivot
    const center = new cv.Point(c2.x, c2.y);

    if (this.debug) {
      // draw centroids
      polygons.forEach(({ center }) => {
        cv.circle(img, center, 10, new cv.Scalar(255, 0, 0, 255), -1);
      });
    }

    const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x) * 180 / Math.PI;

    return { center, angle };
  }

  frameRotation(img: Mat, ROI: Rect) {
    const imgSize = img.cols * img.rows;

    const frame = this.findPolygons(img, ROI, imgSize * 0.5, 0, 1)[0];

    if (!frame) {
      throw new Error('フレームを検出できませんでした');
    }

    if (this.debug) {
      // draw centroids
      cv.circle(img, frame.center, 10, new cv.Scalar(255, 0, 0, 255), -1);
    }

    return {
      center: frame.center,
      angle: frame.angle,
    };
  }

  calcRotation(mode: MODE, img: Mat, ROI: Rect) {
    return mode === MODE.PEG_HOLE
      ? this.pegHoleRotation(img, ROI)
      : this.frameRotation(img, ROI);
  }

  async onRequestPivot(mode: MODE, img: Mat, ROI: Rect) {
    const { center } = this.calcRotation(mode, img, ROI);

    return center;
  }

  async onRequestProcessing(mode: MODE, image: Mat, refImage: Mat, ROI: Rect, pivot: Point) {
    const size = new cv.Size(refImage.cols, refImage.rows);

    const padded = new cv.Mat();

    // add padding to image to fit the reference image
    cv.copyMakeBorder(
      image, padded,
      0, Math.max(0, size.height - image.rows),
      0, Math.max(0, size.width - image.cols),
      cv.BORDER_CONSTANT,
      new cv.Scalar(255, 255, 255, 255),
    );

    const { center, angle } = this.calcRotation(mode, padded, ROI);

    // M = T*R
    // get the rotation matrix R
    const M = cv.getRotationMatrix2D(center, angle, 1);
    // apply translation T
    M.data64F[2] += pivot.x - center.x;
    M.data64F[5] += pivot.y - center.y;

    const result = new cv.Mat();

    cv.warpAffine(
      padded, result, M, size,
      cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255),
    );

    // clear
    M.delete();
    padded.delete();

    return result;
  }
}

export default new Refiner();
