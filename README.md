# @1nkvi/utils

```shell
pnpm i @1nkvi/utils
```

Helper functions for **deeply merging** partial objects and arrays, plus a few small array/value utilities. Give it a
list of partial objects and it composes them into one — overriding primitives, concatenating and de-duplicating arrays,
and merging nested objects recursively — while filtering out "empty" values like `null`, `undefined` and `""`.

## Changelog

[Changelog link](./CHANGELOG.md)

## Quick start

```ts
import { merge } from "@1nkvi/utils"

merge([{ id: 1 }, { name: "Ada" }, { name: "Ada Lovelace" }])
// → { id: 1, name: "Ada Lovelace" }
```

Every export is available from the package root:

```ts
import {
	merge,
	mergeArrays,
	filterValidPrimitiveArrayValues,
	tuplify,
	isPlainObject,
	isEmptyObject,
	isEmptyArray,
	isInvalidNumber,
} from "@1nkvi/utils"
```

---

## `merge(values, options?)`

Deeply merges an array of partial objects (left to right) into a single object.

```ts
merge<TData>(values: Array<Partial<TData>>, options?: MergeOptions): Partial<TData>
```

The result is a _deep partial_ of `TData` — it contains every key seen across the inputs that passed validation, but no
field is guaranteed to be present.

### How it merges

- **Primitives** — the last _valid_ value wins. Invalid values (see [Invalid primitives](#invalid-primitives)) are
  skipped, so a later `""` or `null` won't clobber an earlier real value.
- **Arrays** — concatenated, then primitive values are de-duplicated. (Objects/arrays nested inside an array are kept
  as-is.)
- **Objects** — merged recursively, to any depth.
- **Mixed primitive vs. array** for the same key — the array wins by default. With `enableSingleValueArrays`, the single
  value is wrapped into the array instead so nothing is lost.
- Inputs are **never mutated**; a new object is returned.

### Examples

```ts
// Compose keys from several partials
merge([{ int: 1 }, { float: 2.3 }, { text: "Hello" }])
// → { int: 1, float: 2.3, text: "Hello" }

// Later valid primitives override earlier ones; "" is ignored
merge([{ int: 1, text: "Hello" }, { int: 2, text: "" }, { int: 3 }])
// → { int: 3, text: "Hello" }

// Arrays concatenate and de-duplicate
merge([{ nums: [1, 2, 3] }, { nums: [4] }])
// → { nums: [1, 2, 3, 4] }

// Primitive vs. array on the same key — the array wins
merge([{ text: "first" }, { text: ["second", "third"] }])
// → { text: ["second", "third"] }

// ...unless you opt into folding the single value in
merge([{ text: "first" }, { text: ["second", "third"] }], { enableSingleValueArrays: true })
// → { text: ["first", "second", "third"] }

// Nested objects and arrays of objects merge recursively
merge([{ node: [{ text: "A", children: [{ text: "A.1" }] }] }, { node: [{ int: 20 }] }])
// → { node: [{ text: "A", children: [{ text: "A.1" }] }, { int: 20 }] }
```

### `MergeOptions`

| Option                           | Default | Effect                                                                                                                        |
| -------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `enableSingleValueArrays`        | `false` | When a key mixes a single value and an array, wrap the single value into the array (instead of letting the array replace it). |
| `disableDistinctPrimitiveFilter` | `false` | Keep duplicate primitives in merged arrays instead of de-duplicating.                                                         |
| `nullIsValid`                    | `false` | Treat `null` as a valid value (don't filter it out).                                                                          |
| `undefinedIsValid`               | `false` | Treat `undefined` as a valid value.                                                                                           |
| `emptyStringIsValid`             | `false` | Treat `""` as a valid value.                                                                                                  |
| `validators`                     | `[]`    | Extra predicates `(value) => boolean`; returning `true` marks a value **invalid** and filters it out.                         |

---

## `mergeArrays(arrays, options?)`

Flattens several arrays into one. By default, primitive values are de-duplicated and invalid primitives are dropped.

```ts
mergeArrays<TData>(arrays: TData[][], options?: MergeArraysOptions): TData[]
```

```ts
mergeArrays([["first"], ["second"], ["third", "fourth"]])
// → ["first", "second", "third", "fourth"]

// Duplicates removed
mergeArrays([["first"], ["first", "second"]])
// → ["first", "second"]

// Invalid primitives ("" here) are filtered out
mergeArrays([["first"], [""]])
// → ["first"]

// Keep everything as-is
mergeArrays([["first"], ["first", ""]], { disableDistinctPrimitiveFilter: true })
// → ["first", "first", ""]
```

### `MergeArraysOptions`

| Option                           | Default | Effect                                                               |
| -------------------------------- | ------- | -------------------------------------------------------------------- |
| `disableDistinctPrimitiveFilter` | `false` | Keep duplicates and invalid primitives instead of filtering.         |
| `nullIsValid`                    | `false` | Treat `null` as valid.                                               |
| `undefinedIsValid`               | `false` | Treat `undefined` as valid.                                          |
| `emptyStringIsValid`             | `false` | Treat `""` as valid.                                                 |
| `validators`                     | `[]`    | Extra `(value) => boolean` predicates; `true` marks a value invalid. |

---

## `filterValidPrimitiveArrayValues(flatArray, options?)`

Takes a single flat array, removes invalid primitives, and de-duplicates the rest.

```ts
filterValidPrimitiveArrayValues<TData>(flatArray: TData[], options?): TData[]
```

```ts
filterValidPrimitiveArrayValues(["first", "", null, "second", "second"])
// → ["first", "second"]
```

Accepts the same validity overrides as above (`nullIsValid`, `undefinedIsValid`, `emptyStringIsValid`).

---

## Invalid primitives

The merge/filter functions skip values considered "empty" or "meaningless". By default these are:

- `null`
- `undefined`
- empty string `""`
- `NaN`
- `Infinity` and `-Infinity`
- empty array `[]`
- empty object `{}`

Note that **`0` and `false` are valid** — they are kept. You can relax the defaults per call with `nullIsValid` /
`undefinedIsValid` / `emptyStringIsValid`, or add your own rules via `validators`:

```ts
// Drop any string that starts with a hash
merge([{ tag: "release" }, { tag: "#draft" }], {
	validators: [(v) => typeof v === "string" && v.startsWith("#")],
})
// → { tag: "release" }
```

---

## `tuplify(value)`

Wraps a single value into a one-element array, and leaves an existing array untouched. Handy for normalizing a `T | T[]`
value into `T[]`.

```ts
tuplify("a") // → ["a"]
tuplify(["a", "b"]) // → ["a", "b"]
tuplify([]) // → []
```

---

## Small value helpers

Type-guards and number checks used internally, exposed for convenience:

| Function             | Returns `true` when…                                      |
| -------------------- | --------------------------------------------------------- |
| `isPlainObject(v)`   | `v` is a non-null object that isn't an array              |
| `isEmptyObject(v)`   | `v` is a plain object with no own keys (`{}`)             |
| `isEmptyArray(v)`    | `v` is an array of length `0` (`[]`)                      |
| `isInvalidNumber(v)` | `v` is a number that is `NaN` or not finite (`±Infinity`) |

```ts
isPlainObject({ a: 1 }) // → true
isPlainObject([]) // → false
isEmptyObject({}) // → true
isEmptyArray([]) // → true
isInvalidNumber(NaN) // → true
isInvalidNumber(42) // → false
```
