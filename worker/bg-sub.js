importScripts('./cv-runner.js');

self.onRequestProcessing = function onRequestProcessing(image, refImage, _ROI, _pivot) {
  const mask = new cv.Mat(image.rows, image.cols, cv.CV_8UC1);
  const bgSubtractor = new cv.BackgroundSubtractorMOG2(500, 16, true);
  bgSubtractor.apply(refImage, mask);
  bgSubtractor.apply(image, mask);

  const result = new cv.Mat();
  image.copyTo(result, mask);

  mask.delete();
  bgSubtractor.delete();
  return result;
};
