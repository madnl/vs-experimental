// @flow

import * as React from 'react';
import Rectangle from './Rectangle';

export interface Item {
  key: string,
  render(): React.Element<*>
}

export interface Viewport {
  getRectangle(): Rectangle,
  listen(listener: () => void): () => void,
  scrollBy(offset: number): void
}

export type Anchor = {
  key: string,
  offset: number
}
