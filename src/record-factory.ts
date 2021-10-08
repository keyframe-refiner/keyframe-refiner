import { Record } from 'immutable';

export class Point extends Record({ x: 0, y: 0 }) {
  formRectWith(p: Point) {
    return new Rect({
      x1: this.x,
      y1: this.y,
      x2: p.x,
      y2: p.y,
    });
  }

  clone() {
    return new Point(this.toObject());
  }
}

export class Rect extends Record({ x1: 0, y1: 0, x2: 0, y2: 0 }) {
  get left() {
    return this.x1;
  }

  get top() {
    return this.y1;
  }

  get right() {
    return this.x2;
  }

  get bottom() {
    return this.y2;
  }

  get width() {
    return this.x2 - this.x1;
  }

  get height() {
    return this.y2 - this.y1;
  }

  get x1y1() {
    return new Point({
      x: this.x1,
      y: this.y1,
    });
  }

  get x2y2() {
    return new Point({
      x: this.x2,
      y: this.y2,
    });
  }

  clone() {
    return new Rect(this.toObject());
  }
}
