// @flow

import React from 'react';
import VirtualizedScroller from '../VirtualizedScroller';
import Box from './Box';
import range from '../util/range';
import windowViewport from '../viewport/window';
import type { Item } from '../VirtualizedScroller/interfaces';

const ITEM_COUNT = 20;
const COMPLEXITY = 40;
const HEIGHT = '250px';

const createItem = index => ({
  key: index.toString(),
  render() {
    return <Box index={index} complexity={COMPLEXITY} height={HEIGHT} />;
  }
});

const initialItems = range(ITEM_COUNT, createItem);

export default class ColoredList extends React.Component {
  state: { items: Item[] };

  constructor(props: {}, context: Object) {
    super(props, context);
    this.state = { items: initialItems };
  }

  componentWillMount() {
    const inserter = (fn: (Item[]) => number) => {
      this.setState(({ items }: { items: Item[] }) => {
        const newIndex = items.length;
        const index = fn(items);
        if (index < 0) {
          console.error('Index not found');
        }
        const newItems = index >= 0
          ? [...items.slice(0, index), createItem(newIndex), ...items.slice(index)]
          : items;
        return { items: newItems };
      });
    };
    const adjustedIndex = (key: number, delta = 0) => items => {
      const index = items.findIndex(item => item.key === key.toString());
      return index >= 0 ? index + delta : index;
    };

    window.list = {
      insertAfter(key: number) {
        inserter(adjustedIndex(key, +1));
      },
      insertBefore(key: number) {
        inserter(adjustedIndex(key));
      },
      insertAtTop() {
        inserter(() => 0);
      },
      insertAtBottom() {
        inserter(items => items.length);
      }
    };
  }

  componentWillUnmount() {
    delete window.list;
  }

  render() {
    return (
      <div>
        <VirtualizedScroller viewport={windowViewport()} items={this.state.items} />
      </div>
    );
  }
}
