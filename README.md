# @1nkvi/utils

```shell
pnpm i @1nkvi/utils
```

A small collection of TypeScript helper functions and utility types. Its centerpiece is **deeply merging** partial
objects and arrays — composing a list of partials into one while overriding primitives, concatenating and de-duplicating
arrays, and merging nested objects recursively, all while filtering out "empty" values like `null`, `undefined` and
`""`. Alongside it are a handful of array, map, randomness, and type-guard utilities, plus reusable object/path utility
types.

## Changelog

[Changelog link](./CHANGELOG.md)

## Quick start

```ts
import { merge } from "@1nkvi/utils"

merge([{ id: 1 }, { name: "Ada" }, { name: "Ada Lovelace" }])
// → { id: 1, name: "Ada Lovelace" }
```

## Modules

| Module                     | What it does                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [array](./docs/array.md)   | Create and normalize arrays: `tuplify` a value into an array, or build index/range arrays with `createArray` and `createRangeArray`.                    |
| [guard](./docs/guard.md)   | Type guards and runtime checks: `isPlainObject`, `isEmptyObject`, `isEmptyArray`, `isInvalidNumber`, plus `triggerExhaustiveSwitch` for exhaustiveness. |
| [map](./docs/map.md)       | `upsert` a `Map` entry — insert a value, or combine it with the existing one via a callback.                                                            |
| [merge](./docs/merge.md)   | Deeply `merge` partial objects, `mergeArrays` with de-duplication, and `filterValidPrimitiveArrayValues`, all skipping "empty" values.                  |
| [object](./docs/object.md) | `replace` a single deeply nested value by dot-notation path — immutably and type-safely, without touching its siblings.                                 |
| [random](./docs/random.md) | Random integers: `random` within inclusive/exclusive bounds, and `randomMarginalChange` to nudge a value by fixed and percentage margins.               |
| [types](./docs/types.md)   | Utility types for nested objects: `DeepPartial`, `DotPaths`, `LeafDotPaths`, `DotPathsWithArrayIndex`, `FlatObject`, `IsPlainObject`.                   |
