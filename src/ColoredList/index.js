// @flow

import React from 'react';
import VirtualizedScroller from '../VirtualizedScroller';
import Box from './Box';
import range from '../util/range';
// import windowViewport from '../viewport/window';
import elementViewport from '../viewport/scrollableElement';
import type { Item, Viewport } from '../VirtualizedScroller/interfaces';

const INITIAL_ITEM_COUNT = 100;
const COMPLEXITY = 3333;
const HEIGHT = '98px';

const INITIAL_ANCHOR = {
  key: '20',
  offset: 0
};

const createItem = index => ({
  key: index.toString(),
  render() {
    return <Box index={index} complexity={COMPLEXITY} height={HEIGHT} />;
  }
});

const mkItems = (fromIndex: number, count: number) => range(count, i => createItem(fromIndex + i));

const initialItems = mkItems(0, INITIAL_ITEM_COUNT);

type Props = {};
type State = { items: Item[], viewport: ?Viewport };

export default class ColoredList extends React.Component<Props, State> {
  constructor(props: {}, context: Object) {
    super(props, context);
    this.state = { items: initialItems, viewport: undefined };
  }

  componentWillMount() {
    const updateItems = (fn: (Item[]) => Item[]) => {
      this.setState(({ items }: { items: Item[] }) => ({ items: fn(items) }));
    };
    const inserter = (fn: (Item[]) => number, count: number) => {
      updateItems((items) => {
        const index = fn(items);
        if (index < 0) {
          console.error('Index not found');
        }
        return index >= 0
          ? [...items.slice(0, index), ...mkItems(items.length, count), ...items.slice(index)]
          : items;
      });
    };
    const adjustedIndex = (key: number, delta = 0) => (items) => {
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
    const { viewport } = this.state;
    return (
      <div ref={this._setViewport} style={{ height: '100vw', overflow: 'scroll' }}>
        {viewport && (
          <VirtualizedScroller
            initialAnchor={INITIAL_ANCHOR}
            viewport={viewport}
            items={this.state.items}
          />
        )}
      </div>
    );
  }

  _setViewport = (elem: ?Element) => {
    this.setState({
      viewport: elem && elementViewport(elem)
    });
  };
}
