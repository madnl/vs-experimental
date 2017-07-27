// @flow

import React from 'react';
import { Item } from './interfaces';

type Props = {
  item: Item,
  shouldUpdate: (prev: Item, next: Item) => boolean
};

export default class Cell extends React.Component {
  props: Props;

  shouldComponentUpdate(nextProps: Props) {
    const { item } = this.props;
    return nextProps.shouldUpdate(item, nextProps.item);
  }

  render() {
    return this.props.item.render();
  }
}
