import { List } from 'immutable';

export { MODE } from '../shared/mode';

// steps
export enum STEP {
  OPEN_IMAGES = 'OPEN_IMAGES',
  SELECT_REF_IMAGE = 'SELECT_REF_IMAGE',
  SET_ROI = 'SET_ROI',
  SET_PIVOT = 'SET_PIVOT',
  RUN_CV = 'RUN_CV',
}

export const stepDescription = {
  [STEP.OPEN_IMAGES]: '原画を開く',
  [STEP.SELECT_REF_IMAGE]: '基準画像選択',
  [STEP.SET_ROI]: '対象領域設定',
  [STEP.SET_PIVOT]: '基準位置設定',
  [STEP.RUN_CV]: 'OpenCV 処理',
};

export const defaultSteps = List([
  STEP.OPEN_IMAGES,
  STEP.SELECT_REF_IMAGE,
  STEP.SET_ROI,
  STEP.SET_PIVOT,
  STEP.RUN_CV,
]);
