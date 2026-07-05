# @1nkvi/utils

[![npm version](https://img.shields.io/npm/v/@1nkvi/utils.svg)](https://www.npmjs.com/package/@1nkvi/utils)
[![npm downloads](https://img.shields.io/npm/dm/@1nkvi/utils.svg)](https://www.npmjs.com/package/@1nkvi/utils)
[![types](https://img.shields.io/npm/types/@1nkvi/utils.svg)](https://www.npmjs.com/package/@1nkvi/utils)
[![license](https://img.shields.io/npm/l/@1nkvi/utils.svg)](./LICENSE)

Type-safe utility functions for the common scenarios that occur when working with objects — deep merging, immutable updates
by dot-notation path, and dot-path utility types — plus a handful of array, map, randomness, and type-guard helpers to
round things out.

- 🧩 **Fully typed** — written in TypeScript; ships its own declarations.
- 🌳 **Tree-shakeable** — side-effect free, so bundlers drop what you don't import.
- 🪶 **Zero runtime dependencies.**

## Requirements

- **ESM-only.** The package ships only an `import` entry — use it from ESM (or a bundler). `require("@1nkvi/utils")`
  is not supported.
- **Node ≥ 24.**

## Install

```shell
pnpm i @1nkvi/utils
```

## Changelog

[Changelog link](./CHANGELOG.md)

## Quick start

```ts
import { merge } from "@1nkvi/utils"

merge([{ id: 1 }, { name: "Hello" }, { name: "World" }])
// → { id: 1, name: "World" }
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
| [types](./docs/types.md)   | Utility types for nested objects: `DeepPartial`, `DotPaths`, `LeafDotPaths`, `DotPathsWithArrayIndex`, `FlatObject`, `IsPlainObject`, plus `LooseString` for string-literal autocomplete. |
| [window](./docs/window.md) | Browser DOM helpers: `getCssProperty` reads a computed CSS custom property from an element (defaults to `<html>`).                                      |
