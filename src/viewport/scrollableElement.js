// @flow

import type { Viewport } from '../VirtualizedScroller/interfaces';
import Rectangle from '../VirtualizedScroller/Rectangle';

export default (domElement: Element, wnd: typeof window = window): Viewport => {
  if (wnd.getComputedStyle(domElement).overflow !== 'scroll') {
    console.error(
      'Element passed to create viewport should have overflow: scroll'
    );
  }
  return {
    listen(listener) {
      domElement.addEventListener('scroll', listener);
      return () => {
        domElement.removeEventListener('scroll', listener);
      };
    },

    scrollBy(offset) {
      domElement.scrollTop += offset;
    },

    getRectangle() {
      // TODO: Is this valid?
      const r = domElement.getBoundingClientRect();
      return new Rectangle(r.top, r.height);
    }
  };
};
