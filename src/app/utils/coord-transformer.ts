import type { Point } from './record-factory';

export function defaultTransformer(p: Point) {
  return p.clone();
}
