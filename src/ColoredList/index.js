// @flow

import React from 'react';
import VirtualizedScroller from '../VirtualizedScroller';
import Box from './Box';
import range from '../util/range';
import windowViewport from '../viewport/window';

const ITEM_COUNT = 20;
const COMPLEXITY = 100;
const HEIGHT = '250px';

const items = range(ITEM_COUNT, index => ({
  key: index.toString(),
  render() {
    return <Box index={index} complexity={COMPLEXITY} height={HEIGHT} />;
  }
}));

export default class ColoredList extends React.Component {
  render() {
    return (
      <div>
        <VirtualizedScroller viewport={windowViewport()} items={items} />
      </div>
    );
  }
}
