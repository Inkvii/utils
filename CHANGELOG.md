## Features

- Added `IsOpaque` type, resolving to `true` for types without statically known keys (`any`, `unknown`, `object`, `{}`)
- Added `PathValue<T, TPath>` type, resolving the exact type at a dot-notation path by walking `T` segment by segment
- Added `objectUtils.diff(input, initial, options?)`, which recursively compares two objects and returns only the
  differing values (`{ path, inputValue, initialValue }`) as a nested or flat (`output: "flat"`) result. It supports
  custom array pairing (`onArrayDiff`), a leaf comparator (`isEqual`) and ignored paths (`ignore`); dates are compared
  by value, and non-serializable values and circular references are skipped
- Added `objectUtils.hasDiff(...)` (boolean "is dirty" check that stops at the first difference),
  `objectUtils.isEqualLeaf(...)` (default leaf comparator) and `objectUtils.isDiffEntry(...)` (type guard for nested
  results)
- Added `arrayUtils.diffByIndex(inputArray, initialArray)`, which pairs array items by index. It's the default
  `onArrayDiff` of `objectUtils.diff`
- `DotPaths`, `LeafDotPaths`, `DotPathsWithArrayIndex` and `FlatObject` accept an optional `TDepth` parameter (default
  `5`) limiting how many nested levels are expanded; deeper paths are typed loosely as `${path}.${string}`, so recursive
  types no longer expand forever

## Refactor

- **Breaking:** `guardUtils.isPlainObject` now accepts only object literals and `Object.create(null)` — `Date`, `Map`,
  `Set` and class instances are no longer plain objects. `guardUtils.isEmptyObject` follows, so an empty `Map` is no
  longer an "empty object" and is kept by `mergeUtils.merge`
- **Breaking:** `randomUtils.random` returns only integers inside the interval (`random(1.5, 3)` → `2` or `3`) and
  throws when the interval contains no integer, including `min === max` with an excluded bound. Error messages changed
  to `Min must be less than or equal to max...` and `Cannot generate random integer from interval ...`

- `objectUtils.get` return type and `objectUtils.replace` `value` type are now `PathValue<TObject, TKey>` instead of
  `FlatObject<TObject>[TKey]`. Paths below a `Record<string, T>` resolve exactly (`"byId.1.value"` → `string`, not the
  record value), and paths below the `FlatObject` depth limit get their exact type instead of `unknown`
- `FlatObject` now emits paths for numeric keys (`Record<number, T>`, `{ 1: T }`) as `${bigint}` segments — previously
  such keys had no child paths at all
- `objectUtils.get` reads only own properties, so a path never resolves to an inherited value — e.g. `"toString"` or
  `"tags.map"` now yield `undefined` instead of the prototype function

## Bugfix

- `mergeUtils.merge` no longer turns `Date`, `Map`, `Set` and class instances into `{}`; they are merged as values
- `mergeUtils.merge` no longer returns an input's object/array by reference when a later value for the key is invalid
  (e.g. `null`) or a primitive — the result gets a copy
- `randomUtils.random` with both `excludeMin` and `excludeMax` no longer returns `max`
- `randomUtils.randomMarginalChange` respects `absoluteMin` / `absoluteMax` of `0`, swaps bounds instead of throwing for
  negative values, and returns the rounded middle when the interval contains no integer

# v0.6.1

## Refactor

- **Breaking:** functions are no longer exported flat from the package root. Each module is exported as a namespace —
  `arrayUtils`, `guardUtils`, `mapUtils`, `mergeUtils`, `objectUtils`, `randomUtils`, `windowUtils` — e.g.
  `objectUtils.replace(...)`. Option types moved with them (`mergeUtils.MergeOptions`); utility types from `types` stay
  root exports
- **Breaking:** renamed `createArray` → `arrayUtils.create`, `createRangeArray` → `arrayUtils.createFromRange` and
  `getValueByKey` → `objectUtils.get`

## Fixes

- `FlatObject` now indexes arrays with `${bigint}` instead of `${number}`. Nested array paths such as `"matrix.0.1"` no
  longer resolve to an intersection of both depths, and non-integer indices (`"items.1.5"`, `"items.1e3"`) are rejected
  by `objectUtils.get` and `objectUtils.replace`
- `DotPathsWithArrayIndex` now emits `${bigint}` array segments instead of `${number}`, so non-integer indices
  (`"items.1.5"`) are no longer valid paths
- `FlatObject` of a type without known keys (`object`, `{}`, `unknown`, `any`) now falls back to
  `Record<string, unknown>` instead of an empty key set, so `objectUtils.get(input as object, name as string)` compiles
  and returns `unknown`
- `DotPaths`, `LeafDotPaths` and `DotPathsWithArrayIndex` apply the same fallback: types without known keys produce
  `string` instead of `never`, and an opaque nested field yields `` `field.${string}` `` — previously `LeafDotPaths`
  dropped such a field entirely

# v0.5.0

## Features

- Added `getValueByKey(...)` for reading a nested value by dot-notation path, with the return type inferred from the
  path

# v0.4.0

## Features

- Added `LooseString` type for string with autocomplete of the union type
- Added `getCssProperty(...)` for retrieving css variable values

# v0.3.1

## Refactor

- Strip optional types from result of `DotPaths` and similar

# v0.3.0

## Features

- Added changelog
- Added helper types for path traveling
- Added `replace` for immutable, type-safe deep updates by dot-notation path
- `DotPaths` now emits intermediate object paths in addition to leaves; `DotPathsWithArrayIndex` and `FlatObject` handle
  array indices and whole object/array paths

## Refactor

- Internal restructuralization of types and objects

# v0.2.0

## Features

- Added `random.ts` util functions
- Added `triggerExhaustiveSwitch` and `tuplify`
