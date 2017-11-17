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
const alignBottomWithAdjacentTop = (prev, adjacent) =>
  adjacent.top - prev.height;

const STEP_TOWARDS_FIRST_ITEM = -1;
const STEP_TOWARDS_LAST_ITEM = 1;

/**
 * Relaxation is the process through which we ensures items are laid out next
 * to one another, without any gaps between them and without having any
 * overlaps between consecutive items. You can think of the list of items
 * as a spring - this function makes sure the spring is neither compressed
 * nor extended.
 *
 * In order to perform relaxation we need a reference item, denoted by the
 * anchorIndex, around which we set the positions for the other items. The
 * anchor item will have the same position at the end of the procedure, while
 * updates for the positions of the other items are propagated outwards with
 * the anchor as the center of the propagation 'wave'.
 */
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
