// @flow

export default function updateValues<K, V>(m: Map<K, V>, fn: V => V) {
  m.forEach((v, k) => {
    m.set(k, fn(v));
  });
}
