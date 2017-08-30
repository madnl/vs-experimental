// @flow

import Rectangle from './Rectangle';
import updateValues from '../util/updateValues';

export default class Layout {
  _rectangles: Map<string, Rectangle>;
  _defaultRectangle: Rectangle;

  constructor(assumedItemHeight: number) {
    this._rectangles = new Map();
    this._defaultRectangle = new Rectangle(0, assumedItemHeight);
  }

  rectangleFor(key: string): Rectangle {
    return this._rectangles.get(key) || this._defaultRectangle;
  }

  updateHeight(key: string, height: number) {
    const rectangle = this.rectangleFor(key);
    if (rectangle.height !== height) {
      this._rectangles.set(key, new Rectangle(rectangle.top, height));
    }
  }

  updateRectangle(key: string, rectangle: Rectangle) {
    this._rectangles.set(key, rectangle);
  }

  translateAll(offset: number) {
    updateValues(this._rectangles, (r) => r.translateBy(offset));
  }
}
