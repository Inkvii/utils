# merge

Deeply merge partial objects and arrays into one. Give it a list of partials and it composes them — overriding
primitives, concatenating and de-duplicating arrays, merging nested objects recursively — while filtering out "empty"
values like `null`, `undefined` and `""`.

All exports are available under the `mergeUtils` namespace from the package root:

```ts
import { mergeUtils } from "@1nkvi/utils"
```

Option types live on the same namespace, e.g. `mergeUtils.MergeOptions<TData>`.

---

## `mergeUtils.merge(values, options?)`

Deeply merges an array of partial objects (left to right) into a single object.

```ts
mergeUtils.merge<TData extends object>(values: DeepPartial<TData>[], options?: MergeOptions<TData>): DeepPartial<TData>
```

The result is a [_deep partial_](./types.md#deeppartialt) of `TData` — it contains every key seen across the inputs that
passed validation, but no field is guaranteed to be present.

### How it merges

- **Primitives** — the last _valid_ value wins. Invalid values (see [Invalid primitives](#invalid-primitives)) are
  skipped, so a later `""` or `null` won't clobber an earlier real value.
- **Arrays** — concatenated, then primitive values are de-duplicated. (Objects/arrays nested inside an array are kept
  as-is.)
- **Objects** — merged recursively, to any depth. Only plain objects (object literals, see
  [`guardUtils.isPlainObject`](./guard.md#value-guards)) are merged key by key; `Date`, `Map`, `Set` and class instances
  are treated as values, so the last valid one wins.
- **Mixed primitive vs. array** for the same key — the array wins by default. With `enableSingleValueArrays`, the single
  value is wrapped into the array instead so nothing is lost.
- Inputs are **never mutated**; a new object is returned. Objects and arrays in the result are copies, even when a later
  invalid value (e.g. `null`) leaves an earlier object as the winner — only objects nested inside arrays keep their
  original references.
- The `__proto__` key is ignored to avoid prototype pollution.

### Examples

```ts
// Compose keys from several partials
mergeUtils.merge([{ int: 1 }, { float: 2.3 }, { text: "Hello" }])
// → { int: 1, float: 2.3, text: "Hello" }

// Later valid primitives override earlier ones; "" is ignored
mergeUtils.merge([{ int: 1, text: "Hello" }, { int: 2, text: "" }, { int: 3 }])
// → { int: 3, text: "Hello" }

// Arrays concatenate and de-duplicate
mergeUtils.merge([{ nums: [1, 2, 3] }, { nums: [4] }])
// → { nums: [1, 2, 3, 4] }

// Primitive vs. array on the same key — the array wins
mergeUtils.merge([{ text: "first" }, { text: ["second", "third"] }])
// → { text: ["second", "third"] }

// ...unless you opt into folding the single value in
mergeUtils.merge([{ text: "first" }, { text: ["second", "third"] }], { enableSingleValueArrays: true })
// → { text: ["first", "second", "third"] }

// Nested objects and arrays of objects merge recursively
mergeUtils.merge([{ node: [{ text: "A", children: [{ text: "A.1" }] }] }, { node: [{ int: 20 }] }])
// → { node: [{ text: "A", children: [{ text: "A.1" }] }, { int: 20 }] }

// Dates (and Map, Set, class instances) are values, not merged key by key
mergeUtils.merge([{ date: new Date(1) }, { date: new Date(0) }])
// → { date: new Date(0) }

// A later null doesn't clobber the object, and the result gets a copy of it
const first = { obj: { int: 1 } }
const merged = mergeUtils.merge([first, { obj: null }])
// → { obj: { int: 1 } }, and merged.obj !== first.obj
```

### `MergeOptions`

| Option                           | Default | Effect                                                                                                                        |
| -------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `enableSingleValueArrays`        | `false` | When a key mixes a single value and an array, wrap the single value into the array (instead of letting the array replace it). |
| `disableDistinctPrimitiveFilter` | `false` | Keep duplicate primitives in merged arrays instead of de-duplicating.                                                         |
| `nullIsValid`                    | `false` | Treat `null` as a valid value (don't filter it out).                                                                          |
| `undefinedIsValid`               | `false` | Treat `undefined` as a valid value.                                                                                           |
| `emptyStringIsValid`             | `false` | Treat `""` as a valid value.                                                                                                  |

Unlike `mergeArrays`, `merge` does **not** accept custom `validators`.

---

## `mergeUtils.mergeArrays(arrays, options?)`

Flattens several arrays into one. By default, primitive values are de-duplicated and invalid primitives are dropped.
De-duplication only applies when the flattened result contains **no** objects or nested arrays — mixed/object arrays are
returned concatenated as-is.

```ts
mergeUtils.mergeArrays<TData>(arrays: TData[][], options?: MergeArraysOptions<TData>): TData[]
```

```ts
mergeUtils.mergeArrays([["first"], ["second"], ["third", "fourth"]])
// → ["first", "second", "third", "fourth"]

// Duplicates removed
mergeUtils.mergeArrays([["first"], ["first", "second"]])
// → ["first", "second"]

// Invalid primitives ("" here) are filtered out
mergeUtils.mergeArrays([["first"], [""]])
// → ["first"]

// Keep everything as-is
mergeUtils.mergeArrays([["first"], ["first", ""]], { disableDistinctPrimitiveFilter: true })
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

## `mergeUtils.filterValidPrimitiveArrayValues(flatArray, options?)`

Takes a single flat array, removes invalid primitives, and de-duplicates the rest.

```ts
mergeUtils.filterValidPrimitiveArrayValues<TData>(flatArray: TData[], options?: FilterValidPrimitiveArrayValuesOptions): TData[]
```

```ts
mergeUtils.filterValidPrimitiveArrayValues(["first", "", null, "second", "second"])
// → ["first", "second"]
```

Accepts the same validity overrides as above (`nullIsValid`, `undefinedIsValid`, `emptyStringIsValid`). Note that,
unlike `merge` and `mergeArrays`, it does **not** accept custom `validators`.

---

## Invalid primitives

The merge/filter functions skip values considered "empty" or "meaningless". By default these are:

- `null`
- `undefined`
- empty string `""`
- `NaN`
- `Infinity` and `-Infinity`
- empty array `[]`
- empty plain object `{}` (a `Date` or an empty `Map`/`Set` is valid)

Note that **`0` and `false` are valid** — they are kept. You can relax the defaults per call with `nullIsValid` /
`undefinedIsValid` / `emptyStringIsValid`, or add your own rules to `mergeArrays` via `validators`. Custom validators
run **before** the built-in checks, and a validator returning `true` marks the value for removal:

```ts
// Filter out specific enum-like values
mergeUtils.mergeArrays([["A", "keep", "B"]], {
	validators: [(value) => ["A", "B", "C"].includes(value)],
})
// → ["keep"]
```
