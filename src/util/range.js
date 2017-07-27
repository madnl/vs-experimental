// @flow

export default function<T>(count: number, fn: number => T): T[] {
  const arr = new Array(count);
  for (let i = 0; i < count; i++) {
    arr[i] = fn(i);
  }
  return arr;
}
