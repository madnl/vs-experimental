// @flow

import React from 'react';
import Cell from './Cell';
import type { Item, Viewport, Anchor } from './interfaces';
import Layout from './Layout';
import Rectangle from './Rectangle';
import relaxLayout from './relaxLayout';
import findAnchorIndex from './findAnchorIndex';
import QuiescenceScheduler from '../util/QuiescenceScheduler';

const ASSUMED_ITEM_HEIGHT = 200;

const QUIESCENCE_WAIT_INTERVAL_MS = 150;

const NORMALIZE_OFFSET_THRESHOLD = 0.1;

const VIEWPORT_SCROLL_THRESHOLD = 3;

const MAX_ALLOWABLE_EXTRA_COUNT = 1;

type Props = {
  reversed: boolean,
  initialAnchor?: Anchor,
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
  updateVisibility?: boolean,
  updateRenderableItems?: boolean,
  normalizeLayout?: boolean
};

type NormalizationUrgency = 'none' | 'low' | 'high';

const runwayStyle = (height: number) => ({
  position: 'relative',
  height: `${height}px`
});

const cellStyle = (offset: number) => ({
  position: 'absolute',
  transform: `translateY(${offset}px)`
});

const buildRenderableItems = (items, layout, visibleSet) =>
  items.filter(item => visibleSet.has(item.key)).map(item => ({
    item,
    offset: layout.rectangleFor(item.key).top
  }));

export default class VirtualizedScroller extends React.Component<Props, State> {
  _visibility: Set<string>;
  _layout: Layout;
  _runway: ?Element;
  _cells: Map<string, Element>;
  _unlistenToViewport: ?() => void;
  _quiescenceScheduler: QuiescenceScheduler;

  static defaultProps = {
    shouldUpdate: (prev: Item, next: Item) => prev !== next,
    reversed: false
  };

  constructor(props: Props, context: Object) {
    super(props, context);
    this._visibility = new Set();
    this._layout = new Layout(ASSUMED_ITEM_HEIGHT);

    this._cells = new Map();
    this.state = {
      renderableItems: []
    };
    this._quiescenceScheduler = new QuiescenceScheduler({
      waitIntervalMs: QUIESCENCE_WAIT_INTERVAL_MS
    });
  }

  componentWillMount() {
    const { items, initialAnchor, reversed } = this.props;
    if (items.length > 0) {
      relaxLayout({ layout: this._layout, anchorIndex: 0, items, reversed });
    }
    if (initialAnchor) {
      console.log('initialAnchor', initialAnchor);
      this._visibility.add(initialAnchor.key);
      this._update({ updateRenderableItems: true });
    }
  }

  componentDidMount() {
    this._unlistenToViewport = this.props.viewport.listen(this._handleScroll);
    this._scheduleUpdate({ updateHeights: true, updateVisibility: true });
    this._scrollToInitialAnchor();
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.items !== nextProps.items) {
      this._scheduleUpdate({ updateVisibility: true, updateLayout: true });
      // TODO: schedule state (layout) cleanup on idle
      // displayState('componentWillReceiveProps', this, nextProps.items);
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const { renderableItems } = this.state;
    const { renderableItems: nextRenderableItems } = nextState;
    const { shouldUpdate } = nextProps;
    if (renderableItems.length !== nextRenderableItems.length) {
      return true;
    }
    for (let i = 0; i < renderableItems.length; i += 1) {
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
    console.log('rendering', renderableItems.map(x => x.item.key));
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

  _update = ({
    updateHeights,
    updateLayout,
    updateVisibility,
    normalizeLayout,
    updateRenderableItems
  }: UpdateOptions) => {
    this._quiescenceScheduler.signalWork();
    const view = this._getRelativeView();
    if (updateHeights) {
      this._recordHeights();
    }
    const shouldUpdateLayout = updateLayout || updateHeights;
    if (shouldUpdateLayout && view) {
      this._updateLayout(view);
    }
    if (updateVisibility && view) {
      this._updateVisibility(view);
    }
    const normalizationUrgency = this._normalizationUrgency();
    const shouldNormalize =
      normalizationUrgency === 'high' ||
      (normalizationUrgency === 'low' && normalizeLayout);
    let scrollOffset = 0;
    if (shouldNormalize) {
      scrollOffset = this._normalizeLayout();
    } else if (normalizationUrgency === 'low') {
      this._scheduleUpdateWhenIdle({ normalizeLayout: true });
    }
    if (
      shouldUpdateLayout ||
      updateVisibility ||
      shouldNormalize ||
      updateRenderableItems
    ) {
      this._updateRenderableItems();
    }
    if (scrollOffset) {
      console.log('Forced scroll offset', scrollOffset, {
        normalizeLayout,
        normalizationUrgency
      });
    }
    // if (Math.abs(scrollOffset) > VIEWPORT_SCROLL_THRESHOLD) {
    //   this.props.viewport.scrollBy(-scrollOffset);
    // }
    if (Math.abs(scrollOffset) > 0.1) {
      this.props.viewport.scrollBy(-scrollOffset);
    }

    // console.log('View', stringifyRect(view));

    // displayState(

    //   `_update(${updateHeights ? 'H' : ''}
    // ${shouldUpdateLayout ? 'L' : ''}${updateVisibility ? 'V' : ''})`,

    //   this

    // );
  };

  _scrollToInitialAnchor() {
    const { initialAnchor, viewport, reversed } = this.props;
    if (initialAnchor) {
      const anchor = this._layout.rectangleFor(initialAnchor.key);
      const view = viewport.getRectangle();
      const currentOffset = reversed
        ? view.bottom - anchor.bottom
        : anchor.top - view.top;
      const adjustment = reversed
        ? initialAnchor.offset - currentOffset
        : currentOffset - initialAnchor.offset;
      console.log('_scrollToInitialAnchor', {
        view,
        anchor,
        currentOffset,
        adjustment,
        initialAnchor,
        reversed
      });
      if (Math.abs(adjustment) > VIEWPORT_SCROLL_THRESHOLD) {
        viewport.scrollBy(adjustment);
      }
    }
  }

  _scheduleUpdate = createScheduler(window.requestAnimationFrame, this._update);

  _scheduleUpdateWhenIdle = createScheduler(
    cb => this._quiescenceScheduler.schedule(cb),
    this._update
  );

  _handleScroll = () => {
    this._quiescenceScheduler.signalWork();
    this._scheduleUpdate({ updateVisibility: true });
  };

  _updateRenderableItems() {
    const { items } = this.props;
    const nextRenderableItems = buildRenderableItems(
      items,
      this._layout,
      this._visibility
    );
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
    const nextSet = new Set();
    const prevRendered = new Set();
    this.props.items.forEach(item => {
      if (this._layout.rectangleFor(item.key).doesIntersectWith(view)) {
        nextSet.add(item.key);
      } else if (this._visibility.has(item.key)) {
        prevRendered.add(item.key);
      }
    });
    // TODO: this might be incorrect
    const allowedExtraCount = Math.max(
      0,
      Math.min(MAX_ALLOWABLE_EXTRA_COUNT, this._visibility.size - nextSet.size)
    );
    // console.log({allowedExtraCount});
    const extraItems = [...prevRendered].slice(0, allowedExtraCount);
    // extraItems.length && console.log({ extraItems });
    extraItems.forEach(key => nextSet.add(key));
    this._visibility = nextSet;
  }

  _updateLayout(view: Rectangle) {
    const { items, reversed } = this.props;
    const anchorIndex = findAnchorIndex({
      items,
      visibleSet: this._visibility,
      view,
      layout: this._layout,
      reversed
    });
    console.log('Anchor', {
      anchorIndex,
      anchor: items[anchorIndex] && items[anchorIndex].key
    });
    if (anchorIndex >= 0) {
      relaxLayout({
        layout: this._layout,
        anchorIndex,
        items,
        reversed
      });
    }
  }

  _normalizationUrgency(): NormalizationUrgency {
    const topmostItem = this._topmostItem();
    if (topmostItem) {
      const badTop =
        Math.abs(this._layout.rectangleFor(topmostItem.key).top) >
        NORMALIZE_OFFSET_THRESHOLD;
      const firstItemVisible = this._visibility.has(topmostItem.key);
      if (badTop && firstItemVisible) {
        return 'high';
      }
      const visibleWithNegativeOffsets = [...this._visibility].some(
        key => this._layout.rectangleFor(key).top < -NORMALIZE_OFFSET_THRESHOLD
      );
      if (visibleWithNegativeOffsets) {
        return 'high';
      }
      if (badTop) {
        return 'low';
      }
    }
    return 'none';
  }

  _normalizeLayout() {
    const topmostItem = this._topmostItem();
    const layout = this._layout;
    if (topmostItem) {
      const offset = layout.rectangleFor(topmostItem.key).top;
      if (offset !== 0) {
        layout.translateAll(-offset);
        return offset;
      }
    }
    return 0;
  }

  _getRelativeView() {
    const runwayRect = this._runway && this._runway.getBoundingClientRect();
    return (
      runwayRect &&
      this.props.viewport.getRectangle().translateBy(-runwayRect.top)
    );
  }

  _runwayHeight() {
    const bottomItem = this._bottommostItem();
    return bottomItem ? this._layout.rectangleFor(bottomItem.key).bottom : 0;
  }

  _topmostItem() {
    const { reversed, items } = this.props;
    return items.length > 0
      ? reversed ? items[items.length - 1] : items[0]
      : undefined;
  }

  _bottommostItem() {
    const { reversed, items } = this.props;
    return items.length > 0
      ? reversed ? items[0] : items[items.length - 1]
      : undefined;
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

type Callback = () => void;
type Requester = (callback: Callback) => number;

const createScheduler = (
  requester: Requester,
  callback: UpdateOptions => void
) => {
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

// const displayState = (label, self, itemArray: ?(Item[])) => {
//   const items = itemArray || self.props.items;
//   const visibility = self._visibility;
//   const layout = self._layout;
//   console.log(
//     label,
//     items
//       .map((item) => {
//         const r = layout.rectangleFor(item.key);
//         return {
//           key: item.key,
//           r: { top: r.top, bottom: r.bottom },
//           visible: visibility.has(item.key)
//         };
//       })
//       .map(({ key, r, visible }) => `${key}[${visible ? '+' : '-'}] => ${stringifyRect(r)}`)
//   );
// };

// const stringifyRect = r => `[${Math.round(r.top)}, ${Math.round(r.bottom)})`;
