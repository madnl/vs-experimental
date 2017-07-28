// @flow

export default class Rectangle {
  +top: number;
  +height: number;

  constructor(top: number, height: number) {
    (this: any).top = top;
    (this: any).height = height;
  }

  get bottom(): number {
    return this.top + this.height;
  }

  doesIntersectWith(another: Rectangle): boolean {
    return this.contains(another.top) || another.contains(this.top);
  }

  contains(point: number): boolean {
    return this.top <= point && point < this.bottom;
  }

  translateBy(offset: number) {
    return new Rectangle(this.top + offset, this.height);
  }
}
