// @flow

import type Layout from './Layout';
import type { Item } from './interfaces';
import Rectangle from './Rectangle';

type Params = {
  layout: Layout,
  items: Item[],
  anchorIndex: number
};

export default ({ layout, anchorIndex, items }: Params) => {
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

  propagateRelaxation(-1, (prev, adjacent) => adjacent.top - prev.height);
  propagateRelaxation(+1, (prev, adjacent) => adjacent.bottom);
};
