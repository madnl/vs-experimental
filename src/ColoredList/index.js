// @flow

import React from 'react';
import VirtualizedScroller from '../VirtualizedScroller';
import Box from './Box';
import range from '../util/range';

const ITEM_COUNT = 5;
const COMPLEXITY = 100;
const HEIGHT = '200px';

const items = range(ITEM_COUNT, index => ({
  key: index,
  render() {
    return <Box text={index.toString()} complexity={COMPLEXITY} height={HEIGHT} />;
  }
}));

export default class ColoredList extends React.Component {
  render() {
    return (
      <div>
        <VirtualizedScroller items={items} />
      </div>
    );
  }
}
