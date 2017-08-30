// @flow

import React from 'react';
import VirtualizedScroller from '../VirtualizedScroller';
import Box from './Box';
import range from '../util/range';
import windowViewport from '../viewport/window';
import type { Item } from '../VirtualizedScroller/interfaces';

const ITEM_COUNT = 2;
const COMPLEXITY = 40;
const HEIGHT = '248px';

const createItem = index => ({
  key: index.toString(),
  render() {
    return <Box index={index} complexity={COMPLEXITY} height={HEIGHT} />;
  }
});

const mkItems = (fromIndex: number, count: number) => range(count, i => createItem(fromIndex + i));

const initialItems = mkItems(0, ITEM_COUNT);

type Props = {};
type State = { items: Item[] };

export default class ColoredList extends React.Component<Props, State> {
  constructor(props: {}, context: Object) {
    super(props, context);
    this.state = { items: initialItems };
  }

  componentWillMount() {
    const updateItems = (fn: (Item[]) => Item[]) => {
      this.setState(({ items }: { items: Item[] }) => ({ items: fn(items) }));
    };
    const inserter = (fn: (Item[]) => number, count: number) => {
      updateItems(items => {
        const index = fn(items);
        if (index < 0) {
          console.error('Index not found');
        }
        return index >= 0
          ? [...items.slice(0, index), ...mkItems(items.length, count), ...items.slice(index)]
          : items;
      });
    };
    const adjustedIndex = (key: number, delta = 0) => items => {
      const index = items.findIndex(item => item.key === key.toString());
      return index >= 0 ? index + delta : index;
    };

    window.list = {
      insertAfter(key: number, count = 1) {
        inserter(adjustedIndex(key, +1), count);
      },
      insertBefore(key: number, count = 1) {
        inserter(adjustedIndex(key), count);
      },
      insertAtTop(count = 1) {
        inserter(() => 0, count);
      },
      insertAtBottom(count = 1) {
        inserter(items => items.length, count);
      },
      reset() {
        updateItems(() => initialItems);
      },
      clear() {
        updateItems(() => []);
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
