// @flow

import React from 'react';
import Cell from './Cell';
import { Item } from './interfaces';

type Props = {
  items: Item[],
  shouldUpdate: (prev: Item, next: Item) => boolean
};

export default class VirtualizedScroller extends React.Component {
  props: Props;

  static defaultProps = {
    shouldUpdate: (prev: Item, next: Item) => prev === next
  };

  render() {
    const { items, shouldUpdate } = this.props;
    return (
      <div>
        {items.map((item, key) => (
          <div key={key}>
            <Cell item={item} shouldUpdate={shouldUpdate} />
          </div>
        ))}
      </div>
    );
  }
}
