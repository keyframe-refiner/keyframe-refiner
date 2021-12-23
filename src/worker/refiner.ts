import cv from 'opencv-ts';
import { MODE } from '../shared/mode';
import { CVRunner } from './cv-runner';

import type { Mat, Point, Rect, Size } from 'opencv-ts';
import type { RequestMessageEvent } from '../shared/types';

type Polygon = {
  area: number,
  extent: number,
  angle: number,
  rectSize: Size,
  center: Point,
};

type DetectOptions = {
  minArea: number,
  minExtent: number,
  minVertexCount: number,
  topN: number,
  adaptive: boolean,
  useOtsu: boolean,
};

const defaultOptions: DetectOptions = {
  topN: 3,
  minArea: 100,
  minExtent: 0.75,
  minVertexCount: 4,
  adaptive: false,
  useOtsu: false,
};

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
    {
      minArea,
      minExtent,
      minVertexCount,
      topN,
      adaptive,
      useOtsu,
    }: DetectOptions,
  ) {
    // conver to binary image
    const cutImg = img.roi(ROI);
    const bwImg = new cv.Mat();
    cv.cvtColor(cutImg, bwImg, cv.COLOR_RGBA2GRAY, 0);

    if (adaptive) {
      cv.adaptiveThreshold(bwImg, bwImg, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 21, 2);
    } else {
      let thresholdType = cv.THRESH_BINARY_INV;

      if (useOtsu) {
        thresholdType |= cv.THRESH_OTSU;
      }

      cv.threshold(bwImg, bwImg, 100, 255, thresholdType);
    }

    // remove noise (TODO: not needed?)
    // cv.medianBlur(bwImg, bwImg, 3);

    // the full area may be detected as a contour when using otsu
    // so we need to set a maxima area to filter out it
    const maxArea = useOtsu ? ROI.width * ROI.height * 0.9 : Infinity;

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

      if (
        approx.rows >= minVertexCount &&
        area > minArea && area < maxArea &&
        cv.isContourConvex(approx)
      ) {
        const rect = cv.minAreaRect(approx);
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
    options: Partial<DetectOptions> = defaultOptions,
  ) {
    const opts: DetectOptions = {
      ...defaultOptions,
      ...options,
      adaptive: false,
    };

    const p1 = this.findPolygons(img, ROI, opts);

    if (p1.length === opts.topN) {
      return p1;
    }

    if (this.debug) {
      console.log('%c[worker] non-adaptive threshold failed, trying adaptive...', 'color: #f60');
    }

    const p2 = this.findPolygons(img, ROI, {
      ...opts,
      adaptive: true,
    });

    if (p2.length === opts.topN) {
      return p2;
    }

    throw new Error('対象を検出できませんでした');
  }

  pegHoleRotation(img: Mat, ROI: Rect) {
    const polygons = this.findPolygonsWithTries(img, ROI, {
      useOtsu: true,
      minVertexCount: 5, // TODO: find a better way to filter out the outer rects
    });

    const { center: c1 } = polygons[0];
    const { center: c2 } = polygons[1];
    const { center: c3 } = polygons[2];

    // use the center of the three holes as the pivot
    const center = new cv.Point(
      (c1.x + c2.x + c3.x) / 3,
      (c1.y + c2.y + c3.y) / 3,
    );

    if (this.debug) {
      // draw centroids
      polygons.forEach(({ center }) => {
        cv.circle(img, center, 10, new cv.Scalar(255, 0, 0, 255), -1);
      });
    }

    const angle = Math.atan2(c3.y - c1.y, c3.x - c1.x) * 180 / Math.PI;

    return { center, angle, rectSize: polygons[0].rectSize };
  }

  frameRotation(img: Mat, ROI: Rect) {
    const imgSize = img.cols * img.rows;

    const frame = this.findPolygonsWithTries(img, ROI, {
      topN: 1,
      minArea: 0.5 * imgSize,
      minExtent: 0,
      minVertexCount: 4,
    })[0];

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

  override async onRequestProcessing(image: Mat, filename: string) {
    const { mode, refImage, ROI, pivot } = this.configs!;

    // ensure even size, see https://github.com/keyframe-refiner/keyframe-refiner/issues/1
    const size = new cv.Size(
      refImage.cols % 2 === 0 ? refImage.cols : refImage.cols + 1,
      refImage.rows % 2 === 0 ? refImage.rows : refImage.rows + 1,
    );

    const padded = new cv.Mat();

    // add padding to image to fit the reference image
    // cv.copyMakeBorder(
    //   image, padded,
    //   0, Math.max(0, size.height - image.rows),
    //   0, Math.max(0, size.width - image.cols),
    //   cv.BORDER_CONSTANT,
    //   new cv.Scalar(255, 255, 255, 255),
    // );

    cv.resize(image, padded, size);

    const { center, angle, rectSize } = this.calcRotation(mode, padded, ROI);
    const tx = pivot.x - center.x;
    const ty = pivot.y - center.y;

    let sx = 1;
    let sy = 1;

    if (mode === MODE.FRAME && this.configs!.fitFrame) {
      sx = this.baseSize!.width / rectSize.width;
      sy = this.baseSize!.height / rectSize.height;
    }

    if (this.debug) {
      console.log([
        `filename: ${filename}`,
        `tx: ${tx}`,
        `ty: ${ty}`,
        `sx: ${sx}`,
        `sy: ${sy}`,
        `angle: ${angle}`,
      ].join('\n'));
    }

    const M = this.getRotationMatrix(center, angle, tx, ty, sx, sy);

    const result = new cv.Mat();

    cv.warpAffine(
      padded, result, M, size,
      cv.INTER_CUBIC, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255),
    );

    // clear
    M.delete();
    padded.delete();

    return result;
  }
}

export default new Refiner();
