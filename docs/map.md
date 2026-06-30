# map

Helpers for working with `Map` instances.

All exports are available from the package root:

```ts
import { upsert } from "@1nkvi/utils"
```

---

## `upsert(map, key, value, fn)`

Inserts `value` at `key`, or combines it with the existing value using `fn` when the key is already present. The map is
**mutated in place** and the stored value is returned.

```ts
upsert<TKey, TValue>(
	map: Map<TKey, TValue>,
	key: TKey,
	value: TValue,
	fn: (prev: TValue, value: TValue) => TValue,
): TValue
```

| Parameter | Type                                      | Description                                                                     |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| `map`     | `Map<TKey, TValue>`                       | The map to update (mutated).                                                    |
| `key`     | `TKey`                                    | Key to upsert.                                                                  |
| `value`   | `TValue`                                  | Value to insert or combine.                                                     |
| `fn`      | `(prev: TValue, value: TValue) => TValue` | Called only when `key` already exists; its result becomes the new stored value. |

- **Key missing** — sets `value` directly; `fn` is not called.
- **Key present** — stores and returns `fn(prev, value)`.

```ts
// New key — value is set as-is
const counts = new Map<string, string>()
upsert(counts, "first", "1", (prev, value) => prev + value) // → "1"

// Existing key — combine via fn
counts.set("first", "1")
upsert(counts, "first", "2", (prev, value) => prev + value) // → "12"

// Append to an array value
const lists = new Map<string, string[]>()
lists.set("a", ["1", "2"])
upsert(lists, "a", ["3"], (prev, value) => [...prev, ...value]) // → ["1", "2", "3"]
```
