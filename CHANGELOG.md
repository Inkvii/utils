## Features

- Added `IsOpaque` type, resolving to `true` for types without statically known keys (`any`, `unknown`, `object`, `{}`)

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
