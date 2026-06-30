# array

Small helpers for creating and normalizing arrays: wrap a single value into an array, or build numeric index/range
arrays.

All exports are available from the package root:

```ts
import { tuplify, createArray, createRangeArray } from "@1nkvi/utils"
```

---

## `tuplify(value)`

Wraps a single value into a one-element array, and leaves an existing array untouched. Handy for normalizing a `T | T[]`
value into `T[]`.

```ts
tuplify<TData>(value: TData | TData[]): TData[]
```

| Parameter | Type               | Description                                             |
| --------- | ------------------ | ------------------------------------------------------- |
| `value`   | `TData \| TData[]` | Value to become `[value]`, or an array to pass through. |

- A non-array value is wrapped: `"a"` → `["a"]`.
- An array is returned **as-is** — the same reference, not a copy.
- Falsy primitives (`""`, `0`, `false`, `null`, `undefined`) are still wrapped, not dropped.

```ts
tuplify("a") // → ["a"]
tuplify(1) // → [1]
tuplify(false) // → [false]
tuplify("") // → [""]
tuplify(null) // → [null]
tuplify({ a: 1 }) // → [{ a: 1 }]

tuplify(["a", "b"]) // → ["a", "b"]  (same reference)
tuplify([]) // → []
```

---

## `createArray(length, startIndex?)`

Creates an array of consecutive integers, starting at `startIndex`. Useful for quickly creating skeleton placeholders.

```ts
createArray(length: number, startIndex?: number): number[]
```

| Parameter    | Type     | Default | Description                 |
| ------------ | -------- | ------- | --------------------------- |
| `length`     | `number` | —       | Size of the array.          |
| `startIndex` | `number` | `0`     | Value of the first element. |

```ts
createArray(5) // → [0, 1, 2, 3, 4]
createArray(5, 11) // → [11, 12, 13, 14, 15]
```

---

## `createRangeArray(min, max)`

Returns an array of all integers in the inclusive interval `<min, max>`.

```ts
createRangeArray(min: number, max: number): number[]
```

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| `min`     | `number` | Minimum value (inclusive). |
| `max`     | `number` | Maximum value (inclusive). |

- `min === max` yields a single-element array.
- Negative bounds are supported.

```ts
createRangeArray(-2, 1) // → [-2, -1, 0, 1]
createRangeArray(7, 12) // → [7, 8, 9, 10, 11, 12]
createRangeArray(5, 5) // → [5]
```
