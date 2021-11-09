import cv from 'opencv-ts';
import { MODE } from '../shared/mode';
import { CVRunner } from './cv-runner';

import type { Mat, Point, Rect, RotatedRect, Size } from 'opencv-ts';
import type { RequestMessageEvent } from '../shared/types';

type RotatedRectFixed = RotatedRect & {
  size: Size,
  center: Point,
  angle: number,
};

type Polygon = {
  area: number,
  extent: number,
  angle: number,
  rectSize: Size,
  center: Point,
};

const HOLE_COUNT = 3;

// multiply two 3*3 transformation matrices which are represented as 1D array
function transformMatMul(a: number[], b: number[]): number[] {
  const result: number[] = [];

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum += a[i * 3 + k] * b[k * 3 + j];
      }
      result[i * 3 + j] = sum;
    }
  }

  // the last row stays [0, 0, 1]
  result.push(0, 0, 1);

  return result;
}

// dedup close polygons
function dedupPolygons(polygons: Polygon[], minDist: number = 10) {
  let count = polygons.length;

  for (let i = 0; i < count; i++) {
    const p1 = polygons[i];
    for (let j = i + 1; j < count; j++) {
      const p2 = polygons[j];
      if (
        Math.abs(p1.center.x - p2.center.x) < minDist &&
        Math.abs(p1.center.y - p2.center.y) < minDist
      ) {
        polygons.splice(j, 1);
        j--;
        count--;
      }
    }
  }
}

class Refiner extends CVRunner {
  baseSize: Size | null = null;

  findPolygons(
    img: Mat,
    ROI: Rect,
    minArea: number,
    minExtent: number,
    topN: number,
    adaptive: boolean,
  ) {
    // conver to binary image
    const cutImg = img.roi(ROI);
    const bwImg = new cv.Mat();
    cv.cvtColor(cutImg, bwImg, cv.COLOR_RGBA2GRAY, 0);

    if (adaptive) {
      cv.adaptiveThreshold(bwImg, bwImg, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
    } else {
      cv.threshold(bwImg, bwImg, 100, 255, cv.THRESH_BINARY_INV);
    }

    // remove noise
    cv.medianBlur(bwImg, bwImg, 3);

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
          rectSize: new cv.Size(
            Math.max(width, height),
            Math.min(width, height),
          ),
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

    // remove close polygons
    dedupPolygons(polygons);

    // sort polygons by area...
    polygons.sort((a, b) => b.area - a.area);

    // ...then pick the top N...
    const result = polygons.slice(0, topN);

    // ...and sort them by their center's x coordinate
    result.sort((a, b) => a.center.x - b.center.x);

    return result;
  }

  findPolygonsWithTries(
    img: Mat,
    ROI: Rect,
    minArea = 100,
    minExtent = 0.75,
    topN = HOLE_COUNT,
  ) {
    const p1 = this.findPolygons(img, ROI, minArea, minExtent, topN, false);

    if (p1.length === topN) {
      return p1;
    }

    if (this.debug) {
      console.log('%c[worker] non-adaptive threshold failed, trying adaptive...', 'color: #f60');
    }

    return this.findPolygons(img, ROI, minArea, minExtent, topN, true);
  }

  pegHoleRotation(img: Mat, ROI: Rect) {
    const polygons = this.findPolygonsWithTries(img, ROI);

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

    return { center, angle, rectSize: polygons[0].rectSize };
  }

  frameRotation(img: Mat, ROI: Rect) {
    const imgSize = img.cols * img.rows;

    const frame = this.findPolygonsWithTries(img, ROI, imgSize * 0.5, 0, 1)[0];

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
      rectSize: frame.rectSize,
    };
  }

  calcRotation(mode: MODE, img: Mat, ROI: Rect) {
    return mode === MODE.PEG_HOLE
      ? this.pegHoleRotation(img, ROI)
      : this.frameRotation(img, ROI);
  }

  getRotationMatrix(
    center: Point,
    angle: number,
    tx: number,
    ty: number,
    sx: number,
    sy: number,
  ) {
    // origin(center) translation matrix
    const O = [
      1, 0, center.x,
      0, 1, center.y,
      0, 0, 1,
    ];

    // translation matrix
    const T = [
      1, 0, tx,
      0, 1, ty,
      0, 0, 1,
    ];

    // rotation matrix
    const rad = -angle * Math.PI / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const R = [
      cosA, -sinA, 0,
      sinA, cosA, 0,
      0, 0, 1,
    ];

    // scale matrix
    const S = [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1,
    ];

    // inverse origin translation
    const Oinv = [
      1, 0, -center.x,
      0, 1, -center.y,
      0, 0, 1,
    ];

    const transformations = [O, T, R, S, Oinv];

    // calculate the transformation matrix
    const M = transformations.reduce((acc, cur) => {
      return transformMatMul(acc, cur);
    });

    const M_CV = cv.matFromArray(2, 3, cv.CV_64FC1, M.slice(0, 6));

    return M_CV;
  }

  override setConfigs(evt: RequestMessageEvent<'set-configs'>) {
    super.setConfigs(evt);

    const { mode, refImage, ROI } = this.configs!;

    const { rectSize } = this.calcRotation(mode, refImage, ROI);

    this.baseSize = rectSize;
  }

  override clean(evt: RequestMessageEvent<'clean'>) {
    super.clean(evt);

    this.baseSize = null;
  }

  override async onRequestPivot(mode: MODE, img: Mat, ROI: Rect) {
    const { center } = this.calcRotation(mode, img, ROI);

    return center;
  }

  override async onRequestProcessing(mode: MODE, image: Mat, refImage: Mat, ROI: Rect, pivot: Point) {
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

    const { center, angle, rectSize } = this.calcRotation(mode, padded, ROI);
    const tx = pivot.x - center.x;
    const ty = pivot.y - center.y;

    let sx = 1;
    let sy = 1;

    if (mode === MODE.FRAME && this.configs!.fitFrame) {
      sx = this.baseSize!.width / rectSize.width;
      sy = this.baseSize!.height / rectSize.height;
    }

    const M = this.getRotationMatrix(center, angle, tx, ty, sx, sy);

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