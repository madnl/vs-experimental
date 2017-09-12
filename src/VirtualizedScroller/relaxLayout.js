// @flow

import type Layout from './Layout';
import type { Item } from './interfaces';
import Rectangle from './Rectangle';

type Params = {
  layout: Layout,
  items: Item[],
  anchorIndex: number,
  reversed: boolean
};

const alignTopWithAdjacentBottom = (prev, adjacent) => adjacent.bottom;
const alignBottomWithAdjacentTop = (prev, adjacent) => adjacent.top - prev.height;

const STEP_TOWARDS_FIRST_ITEM = -1;
const STEP_TOWARDS_LAST_ITEM = 1;

export default ({ layout, anchorIndex, items, reversed }: Params) => {
  const anchorKey = items[anchorIndex].key;
  const anchorRectangle = layout.rectangleFor(anchorKey);

  const propagateRelaxation = (
    step: number,
    updateTop: (currentRect: Rectangle, adjacent: Rectangle) => number
  ) => {
    let lastRectangle = anchorRectangle;
    for (let i = anchorIndex + step; i >= 0 && i < items.length; i += step) {
      const key = items[i].key;
      const currentRect = layout.rectangleFor(key);
      const nextTop = updateTop(currentRect, lastRectangle);
      if (nextTop !== currentRect.top) {
        const newRectangle = new Rectangle(nextTop, currentRect.height);
        lastRectangle = newRectangle;
        layout.updateRectangle(key, newRectangle);
      } else {
        lastRectangle = currentRect;
      }
    }
  };

  if (reversed) {
    propagateRelaxation(STEP_TOWARDS_FIRST_ITEM, alignTopWithAdjacentBottom);
    propagateRelaxation(STEP_TOWARDS_LAST_ITEM, alignBottomWithAdjacentTop);
  } else {
    propagateRelaxation(STEP_TOWARDS_FIRST_ITEM, alignBottomWithAdjacentTop);
    propagateRelaxation(STEP_TOWARDS_LAST_ITEM, alignTopWithAdjacentBottom);
  }
};
