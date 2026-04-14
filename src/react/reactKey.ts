// Stable React key for any object without requiring an `id` field.
// Uses a WeakMap so objects can be garbage-collected freely; keys are
// minted lazily on first request and remain stable for the object's
// lifetime. Use: `<li key={reactKey(fighter)}>`.

const keys = new WeakMap<object, string>();
let next = 0;

export function reactKey(obj: object): string {
  let k = keys.get(obj);
  if (k === undefined) {
    k = `k${next++}`;
    keys.set(obj, k);
  }
  return k;
}
