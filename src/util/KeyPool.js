// @flow

const createGenerator = (prefix: string) => {
  let counter = 0;
  return () => {
    const value = prefix + counter;
    counter += 1;
    return value;
  };
};

export default class KeyPool {
  _generator: () => string;
  _index: Map<string, string>;

  constructor(prefix: string = 'key-') {
    this._generator = createGenerator(prefix);
    this._index = new Map();
  }

  reAssign(keys: Set<string>): Map<string, string> {
    const unusedPooledKeys = [...this._index.entries()]
      .filter(([k]) => !keys.has(k))
      .map(([, v]) => v);
    const newIndex = new Map();
    keys.forEach(key => {
      newIndex.set(
        key,
        this._index.get(key) || unusedPooledKeys.pop() || this._generator()
      );
    });
    this._index = newIndex;
    return this._index;
  }
}
