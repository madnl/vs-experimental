// @flow

import * as React from 'react';

export interface Item {
  key: string | number,
  render(): React.Element<*>
}
