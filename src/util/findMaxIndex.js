// @flow

export default function argMax<T>(items: T[], comparator: (T, T) => number): number {
  if (items.length === 0) {
    return -1;
  }
  let maxIndex = 0;
  for (let i = 1; i < items.length; i++) {
    if (comparator(items[maxIndex], items[i]) > 0) {
      maxIndex = i;
    }
  }
  return maxIndex;
}
