// @flow

import React from 'react';
import Cell from './Cell';
import { Item, Viewport } from './interfaces';
import Layout from './Layout';
import Rectangle from './Rectangle';
import relaxLayout from './relaxLayout';
import findAnchorIndex from './findAnchorIndex';

const ASSUMED_ITEM_HEIGHT = 200;

type Props = {
  items: Item[],
  shouldUpdate: (prev: Item, next: Item) => boolean,
  viewport: Viewport
};

type RenderableItem = {
  item: Item,
  offset: number
};

type State = {
  renderableItems: RenderableItem[]
};

type UpdateOptions = {
  updateHeights?: boolean,
  updateLayout?: boolean,
  updateVisibility?: boolean
};

const runwayStyle = (height: number) => ({
  position: 'relative',
  height: `${height}px`
});

const cellStyle = (offset: number) => ({
  position: 'absolute',
  transform: `translateY(${offset}px)`
});

export default class VirtualizedScroller extends React.Component<Props, State> {
  _visibility: Set<string>;
  _layout: Layout;
  _runway: ?Element;
  _cells: Map<string, Element>;
  _unlistenToViewport: ?() => void;

  static defaultProps = {
    shouldUpdate: (prev: Item, next: Item) => prev !== next
  };

  constructor(props: Props, context: Object) {
    super(props, context);
    this._visibility = new Set();
    this._layout = new Layout(ASSUMED_ITEM_HEIGHT);
    this._cells = new Map();
    this.state = {
      renderableItems: []
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.items !== nextProps.items) {
      this._visibility = transferVisibility(this._visibility, nextProps.items);
      this._scheduleUpdate({ updateVisibility: true, updateLayout: true });
      // TODO: schedule state (layout) cleanup on idle
      displayState('componentWillReceiveProps', this, nextProps.items);
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const { renderableItems } = this.state;
    const { renderableItems: nextRenderableItems } = nextState;
    const { shouldUpdate } = nextProps;
    if (renderableItems.length !== nextRenderableItems.length) {
      return true;
    }
    for (let i = 0; i < renderableItems.length; i++) {
      const prev = renderableItems[i];
      const next = nextRenderableItems[i];
      const itemChanged =
        prev.item.key !== next.item.key ||
        shouldUpdate(prev.item, next.item) ||
        prev.offset !== next.offset;
      if (itemChanged) {
        return true;
      }
    }
    return false;
  }

  componentDidMount() {
    this._unlistenToViewport = this.props.viewport.listen(this._handleScroll);
    this._scheduleUpdate({ updateHeights: true, updateVisibility: true });
  }

  componentDidUpdate() {
    this._scheduleUpdate({ updateHeights: true, updateVisibility: true });
  }

  componentWillUnmount() {
    if (this._unlistenToViewport) {
      this._unlistenToViewport();
    }
  }

  render() {
    const { shouldUpdate } = this.props;
    const { renderableItems } = this.state;
    // console.log('rendering', renderableItems.map(x => x.item.key));
    return (
      <div ref={this._setRunway} style={runwayStyle(this._runwayHeight())}>
        {renderableItems.map(({ item, offset }) => (
          <div
            ref={(elem: ?Element) => this._setCell(item.key, elem)}
            style={cellStyle(offset)}
            key={item.key}
          >
            <Cell item={item} shouldUpdate={shouldUpdate} />
          </div>
        ))}
      </div>
    );
  }

  _update = ({ updateHeights, updateLayout, updateVisibility }: UpdateOptions) => {
    const view = this._getRelativeView();
    if (!view) {
      return;
    }
    if (updateHeights) {
      this._recordHeights();
    }
    const shouldUpdateLayout = updateLayout || updateHeights;
    if (shouldUpdateLayout) {
      this._updateLayout(view);
    }
    if (updateVisibility) {
      this._updateVisibility(view);
    }
    if (shouldUpdateLayout || updateVisibility) {
      this._updateRenderableItems();
    }
    console.log('View', stringifyRect(view));
    displayState(`_update(${updateHeights ? 'H' : ''}${shouldUpdateLayout ? 'L' : ''}${updateVisibility ? 'V' : ''})`, this);
  };

  _scheduleUpdate = createScheduler(window.requestAnimationFrame, this._update);

  _handleScroll = () => {
    this._scheduleUpdate({ updateVisibility: true });
  };

  _updateRenderableItems() {
    const { items } = this.props;
    const nextRenderableItems = items
      .filter(item => this._visibility.has(item.key))
      .map(item => ({ item, offset: this._layout.rectangleFor(item.key).top }));
    this.setState({
      renderableItems: nextRenderableItems
    });
  }

  _recordHeights() {
    this._cells.forEach((elem, key) => {
      this._layout.updateHeight(key, elem.getBoundingClientRect().height);
    });
  }

  _updateVisibility(view: Rectangle) {
    this._visibility.clear();
    this.props.items.forEach(item => {
      if (this._layout.rectangleFor(item.key).doesIntersectWith(view)) {
        this._visibility.add(item.key);
      }
    });
  }

  _updateLayout(view: Rectangle) {
    const { items } = this.props;
    const anchorIndex = findAnchorIndex({
      items,
      visibleSet: this._visibility,
      view,
      layout: this._layout
    });
    if (anchorIndex >= 0) {
      relaxLayout({
        layout: this._layout,
        anchorIndex,
        items
      });
    }
  }

  _getRelativeView() {
    const runwayRect = this._runway && this._runway.getBoundingClientRect();
    return runwayRect && this.props.viewport.getRectangle().translateBy(-runwayRect.top);
  }

  _runwayHeight() {
    const { items } = this.props;
    const lastItem = items.length > 0 ? items[items.length - 1] : undefined;
    return lastItem ? this._layout.rectangleFor(lastItem.key).bottom : 0;
  }

  _setRunway = (elem: ?Element) => {
    this._runway = elem;
  };

  _setCell(key: string, elem: ?Element) {
    if (elem) {
      this._cells.set(key, elem);
    } else {
      this._cells.delete(key);
    }
  }
}

const transferVisibility = (visibleSet: Set<string>, items: Item[]): Set<string> => {
  const newVisibleSet = new Set();
  items.forEach(item => {
    if (visibleSet.has(item.key)) {
      newVisibleSet.add(item.key);
    }
  });
  return newVisibleSet;
};

type Callback = () => void;
type Requester = (callback: Callback) => number;

const createScheduler = (requester: Requester, callback: UpdateOptions => void) => {
  let callId = 0;
  let nextOptions: UpdateOptions = {};

  const onCallRequested = () => {
    const options = nextOptions;
    nextOptions = {};
    callId = 0;
    callback(options);
  };

  return (options: UpdateOptions) => {
    nextOptions = { ...options, ...nextOptions };
    if (!callId) {
      callId = requester(onCallRequested);
    }
  };
};


const displayState = (label, self, itemArray: ?Item[]) => {
  const items = itemArray || self.props.items;
  const visibility = self._visibility;
  const layout = self._layout;
  console.log(label,
    items.map(item => {
    const r = layout.rectangleFor(item.key);
    return {
      key: item.key,
      r: { top: r.top, bottom: r.bottom },
      visible: visibility.has(item.key)
    }
  }).map(({ key, r, visible }) => `${key}[${visible ? '+' : '-'}] => ${stringifyRect(r)}`));
}

const stringifyRect = (r) => `[${Math.round(r.top)}, ${Math.round(r.bottom)})`