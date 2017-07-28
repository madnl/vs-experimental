// @flow

import { Item } from './interfaces';
import type Rectangle from './Rectangle';
import findMaxIndex from '../util/findMaxIndex';
import type Layout from './Layout';

type Params = {
  items: Item[],
  view: Rectangle,
  visibleSet: Set<string>,
  layout: Layout
};

export default ({ items, visibleSet, view, layout }: Params): number => {
  const compareFit = ({ key: key1 }: Item, { key: key2 }: Item) =>
    preferTrue(visibleSet.has(key1), visibleSet.has(key2)) ||
    compareRelationToView(view, layout.rectangleFor(key1), layout.rectangleFor(key2));

  return findMaxIndex(items, compareFit);
};

const compareRelationToView = (view, r1, r2) =>
  preferTrue(r1.doesIntersectWith(view), r2.doesIntersectWith(view)) ||
  preferSmaller(Math.abs(view.top - r1.top), Math.abs(view.top - r2.top));

const preferTrue = (b1, b2) => {
  if (b1 && !b2) {
    return -1;
  } else if (!b1 && b2) {
    return 1;
  } else {
    return 0;
  }
};

const preferSmaller = (x1, x2) => {
  if (x1 < x2) {
    return -1;
  } else if (x1 > x2) {
    return 1;
  } else {
    return 0;
  }
};
