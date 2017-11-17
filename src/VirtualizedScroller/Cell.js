// @flow

import React from 'react';
import { Item } from './interfaces';

type Props = {
  item: Item,
  shouldUpdate: (prev: Item, next: Item) => boolean
};

export default class Cell extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const { item } = this.props;
    const { shouldUpdate, item: nextItem } = nextProps;
    return shouldUpdate(item, nextItem);
  }

  render() {
    return this.props.item.render();
  }
}
