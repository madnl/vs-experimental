// @flow

import debounce from 'lodash.debounce';

type Options = {
  waitIntervalMs: number
};

type Callback = () => void;

export default class QuiescenceScheduler {
  _waitIntervalMs: number;
  _queue: Callback[];
  _notify: ?() => void;
  _nextId: number;

  constructor({ waitIntervalMs }: Options) {
    this._waitIntervalMs = waitIntervalMs;
    this._queue = [];
    this._nextId = 0;
  }

  schedule(callback: Callback): number {
    this._queue.push(callback);
    if (!this._notify) {
      this._notify = debounce(this._handleTickAvailable, this._waitIntervalMs);
      this.signalWork();
    }
    this._nextId++;
    return this._nextId;
  }

  signalWork() {
    if (this._notify) {
      this._notify.call(undefined);
    }
  }

  _handleTickAvailable = () => {
    this._queue.forEach(callback => callback());
    this._queue = [];
  };
}
