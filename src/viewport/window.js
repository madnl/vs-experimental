// @flow

import Rectangle from '../VirtualizedScroller/Rectangle';
import type { Viewport } from '../VirtualizedScroller/interfaces';

export default (wnd: typeof window = window): Viewport => ({
  getRectangle() {
    return new Rectangle(0, wnd.innerHeight);
  },

  listen(listener) {
    const onChange = () => listener();
    wnd.addEventListener('scroll', onChange);
    wnd.addEventListener('resize', onChange);
    return () => {
      wnd.removeEventListener('scroll', onChange);
      wnd.removeEventListener('resize', onChange);
    };
  }
});
