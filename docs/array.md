# array

Small helpers for creating and normalizing arrays: wrap a single value into an array, or build numeric index/range
arrays.

All exports are available under the `arrayUtils` namespace from the package root:

```ts
import { arrayUtils } from "@1nkvi/utils"
```

---

## `arrayUtils.tuplify(value)`

Wraps a single value into a one-element array, and leaves an existing array untouched. Handy for normalizing a `T | T[]`
value into `T[]`.

```ts
arrayUtils.tuplify<TData>(value: TData | TData[]): TData[]
```

| Parameter | Type               | Description                                             |
| --------- | ------------------ | ------------------------------------------------------- |
| `value`   | `TData \| TData[]` | Value to become `[value]`, or an array to pass through. |

- A non-array value is wrapped: `"a"` → `["a"]`.
- An array is returned **as-is** — the same reference, not a copy.
- Falsy primitives (`""`, `0`, `false`, `null`, `undefined`) are still wrapped, not dropped.

```ts
arrayUtils.tuplify("a") // → ["a"]
arrayUtils.tuplify(1) // → [1]
arrayUtils.tuplify(false) // → [false]
arrayUtils.tuplify("") // → [""]
arrayUtils.tuplify(null) // → [null]
arrayUtils.tuplify({ a: 1 }) // → [{ a: 1 }]

arrayUtils.tuplify(["a", "b"]) // → ["a", "b"]  (same reference)
arrayUtils.tuplify([]) // → []
```

---

## `arrayUtils.create(length, startIndex?)`

Creates an array of consecutive integers, starting at `startIndex`. Useful for quickly creating skeleton placeholders.

```ts
arrayUtils.create(length: number, startIndex?: number): number[]
```

| Parameter    | Type     | Default | Description                 |
| ------------ | -------- | ------- | --------------------------- |
| `length`     | `number` | —       | Size of the array.          |
| `startIndex` | `number` | `0`     | Value of the first element. |

```ts
arrayUtils.create(5) // → [0, 1, 2, 3, 4]
arrayUtils.create(5, 11) // → [11, 12, 13, 14, 15]
```

---

## `arrayUtils.createFromRange(min, max)`

Returns an array of all integers in the inclusive interval `<min, max>`.

```ts
arrayUtils.createFromRange(min: number, max: number): number[]
```

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| `min`     | `number` | Minimum value (inclusive). |
| `max`     | `number` | Maximum value (inclusive). |

- `min === max` yields a single-element array.
- Negative bounds are supported.

```ts
arrayUtils.createFromRange(-2, 1) // → [-2, -1, 0, 1]
arrayUtils.createFromRange(7, 12) // → [7, 8, 9, 10, 11, 12]
arrayUtils.createFromRange(5, 5) // → [5]
```
