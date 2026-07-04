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
