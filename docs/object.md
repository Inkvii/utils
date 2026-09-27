# object

Helpers for working with plain objects: read and replace nested values by dot-notation path, and compare two objects
with `diff`.

All exports are available under the `objectUtils` namespace from the package root:

```ts
import { objectUtils } from "@1nkvi/utils"
```

---

## `objectUtils.replace(object, key, value)`

Immutably sets `value` at the dot-notation `key` and returns a **new** object — the input is never mutated. Every
container along the path is cloned (arrays for numeric segments, objects otherwise), so a single element or key is
replaced without touching its siblings.

```ts
objectUtils.replace<TObject, TKey extends keyof FlatObject<TObject> & string>(
	object: TObject,
	key: TKey,
	value: FlatObject<TObject>[TKey],
): TObject
```

| Parameter | Type                        | Description                                                                                                                                                                          |
| --------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `object`  | `TObject`                   | The source object. Returned untouched; the result is a clone.                                                                                                                        |
| `key`     | `TKey`                      | A dot-notation path into `object`, constrained to the valid paths of [`FlatObject<TObject>`](./types.md#flatobjectt) (intermediate and leaf paths, including numeric array indices). |
| `value`   | `FlatObject<TObject>[TKey]` | The replacement value. Its type is derived from `key`, so it must match the type at that path.                                                                                       |

- **Type-safe path & value** — `key` only accepts real paths of `object`, and `value` must match the type found there
  (e.g. a `boolean` leaf rejects a `string`, a whole array element must match the element shape).
- **Immutable** — returns a new object; the original and any untouched nested references are preserved.
- **Arrays by index** — a numeric segment (`arr.0`) replaces that element in place, keeping the other elements.

```ts
type User = {
	name: string
	address: { city: string; zip: string }
	tags: string[]
	roles: { id: number; label: string }[]
}

const user: User = {
	name: "Ada",
	address: { city: "London", zip: "SW1" },
	tags: ["admin", "dev"],
	roles: [
		{ id: 1, label: "owner" },
		{ id: 2, label: "editor" },
	],
}

// Replace a leaf value
objectUtils.replace(user, "name", "Ada Lovelace").name // → "Ada Lovelace"

// Replace a nested value — siblings untouched
objectUtils.replace(user, "address.city", "Paris").address // → { city: "Paris", zip: "SW1" }

// Replace one array element field by index
objectUtils.replace(user, "roles.0.label", "admin").roles // → [{ id: 1, label: "admin" }, { id: 2, label: "editor" }]

// Replace a primitive array element
objectUtils.replace(user, "tags.1", "ops").tags // → ["admin", "ops"]

// The input is never mutated
user.name // → "Ada"
```

---

## `objectUtils.get(object, key)`

Reads the value at the dot-notation `key`. The return type is derived from the path, so the result is correctly typed
without a cast — the read counterpart of [`objectUtils.replace`](#objectutilsreplaceobject-key-value).

```ts
objectUtils.get<TObject, TKey extends keyof FlatObject<TObject> & string>(
	object: TObject,
	key: TKey
): FlatObject<TObject>[TKey]
```

| Parameter | Type      | Description                                                                                                                                                                          |
| --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `object`  | `TObject` | The source object. Only read — never mutated.                                                                                                                                        |
| `key`     | `TKey`    | A dot-notation path into `object`, constrained to the valid paths of [`FlatObject<TObject>`](./types.md#flatobjectt) (intermediate and leaf paths, including numeric array indices). |

- **Inferred return type** — the result is `FlatObject<TObject>[TKey]`, so `objectUtils.get(user, "address.zip")` is a
  `string` and `objectUtils.get(user, "address")` is the whole `{ city: string; zip: string }` object.
- **Type-safe path** — `key` only accepts real paths of `object`; unknown paths are a compile error.
- **By reference** — objects and arrays are returned as-is (the same reference), not cloned.
- **Safe on missing values** — a path through a missing container or an out-of-range array index yields `undefined`
  instead of throwing.

```ts
type User = {
	name: string
	address: { city: string; zip: string }
	tags: string[]
	roles: { id: number; label: string }[]
}

const user: User = {
	name: "Ada",
	address: { city: "London", zip: "SW1" },
	tags: ["admin", "dev"],
	roles: [
		{ id: 1, label: "owner" },
		{ id: 2, label: "editor" },
	],
}

// Leaf values — typed as string / number
objectUtils.get(user, "name") // → "Ada"
objectUtils.get(user, "address.city") // → "London"
objectUtils.get(user, "roles.0.id") // → 1

// Whole objects and arrays are valid paths too
objectUtils.get(user, "address") // → { city: "London", zip: "SW1" }
objectUtils.get(user, "roles.1") // → { id: 2, label: "editor" }
objectUtils.get(user, "tags") // → ["admin", "dev"]

// Primitive array element by index
objectUtils.get(user, "tags.1") // → "dev"

// Out-of-range index short-circuits instead of throwing
objectUtils.get(user, "roles.99.label") // → undefined
```

---

## `objectUtils.diff(input, initial, options?)`

Recursively compares `input` against `initial` and returns **only the values that differ**, e.g. the fields a user
changed in a form. Each difference is a [`DiffEntry`](#diffentry) holding both values and their dot-notation path. The
result is either nested (the same shape as `input`) or flat (keyed by path).

```ts
objectUtils.diff<T extends object>(input: T, initial: DeepPartial<T>, options?: DiffOptions & { output?: "nested" }): DiffNested<T>
objectUtils.diff<T extends object>(input: T, initial: DeepPartial<T>, options: DiffOptions & { output: "flat" }): DiffFlat<T>
```

| Parameter | Type                                        | Description                                                               |
| --------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `input`   | `T`                                         | The current object (e.g. form state). Never mutated.                      |
| `initial` | [`DeepPartial<T>`](./types.md#deeppartialt) | The object to compare against (e.g. initial form data). Never mutated.    |
| `options` | [`DiffOptions`](#diffoptions)               | Output shape, array pairing, leaf comparison and ignored paths. Optional. |

- **Only differences** — identical objects produce `{}`. Keys present on one side only are reported with `undefined` on
  the other side; an `undefined` value and a missing key are equal.
- **Objects** are compared key by key (keys from both sides). Keys named `__proto__` are ignored.
- **Arrays** are paired by index (see
  [`arrayUtils.diffByIndex`](./array.md#arrayutilsdiffbyindexinputarray-initialarray)) and each pair is compared
  recursively, so a changed field is reported as `items.1.value`. Inserting a row in the middle shifts every row after
  it, so all of them are reported. Use `options.onArrayDiff` to pair rows differently.
- **Structural mismatch** (object vs primitive, array vs object, added/removed row) is reported as one entry holding the
  whole values.
- **Leaves** are compared with [`objectUtils.isEqualLeaf`](#objectutilsisequalleafinputvalue-initialvalue) by default:
  `Date` by value, `NaN` equals `NaN`, everything else `===`.
- **Skipped values** — values that are not serializable (functions, symbols, bigints, `Map`, `Set`, `RegExp`, boxed
  primitives, class instances) are never reported, even if only one side is non-serializable. Circular references are
  skipped too.
- **Identical references** — an object/array that is the same reference on both sides is considered equal and not
  walked, which makes immutable (React-style) state updates cheap to diff.
- **By reference** — entries hold the original values, not copies.
- **Roots** — if `initial` is not an object/array of the same kind as `input` (e.g. `null`), it's treated as empty and
  every value of `input` is reported.
- In `output: "flat"`, keys that contain `.` produce ambiguous paths. Nested results contain **sparse arrays** when only
  some indices differ (`.map`/`forEach` skip the holes). Use [`objectUtils.isDiffEntry`](#objectutilsisdiffentrynode) to
  tell an entry from a deeper nested node.

```ts
type Form = {
	name: string
	address: { city: string; zip: string }
	roles: { id: number; label: string }[]
}

const initial: Form = {
	name: "Ada",
	address: { city: "London", zip: "SW1" },
	roles: [
		{ id: 1, label: "owner" },
		{ id: 2, label: "editor" },
	],
}

const input: Form = {
	...initial,
	address: { city: "Paris", zip: "SW1" },
	roles: [
		{ id: 1, label: "owner" },
		{ id: 2, label: "admin" },
	],
}

// Nested (default) — mirrors the shape of the input
objectUtils.diff(input, initial)
// → {
//     address: { city: { path: "address.city", inputValue: "Paris", initialValue: "London" } },
//     roles: [ <empty>, { label: { path: "roles.1.label", inputValue: "admin", initialValue: "editor" } } ],
//   }

// Flat — keyed by dot-notation path
objectUtils.diff(input, initial, { output: "flat" })
// → {
//     "address.city": { path: "address.city", inputValue: "Paris", initialValue: "London" },
//     "roles.1.label": { path: "roles.1.label", inputValue: "admin", initialValue: "editor" },
//   }

// Added row — reported as a whole
objectUtils.diff({ tags: ["a", "b"] }, { tags: ["a"] }, { output: "flat" })
// → { "tags.1": { path: "tags.1", inputValue: "b", initialValue: undefined } }

// Structural mismatch — one entry with the whole values
objectUtils.diff({ value: { x: 1 } as object | number }, { value: 5 }, { output: "flat" })
// → { value: { path: "value", inputValue: { x: 1 }, initialValue: 5 } }

// Dates are compared by value, functions are skipped
objectUtils.diff({ at: new Date(0), fn: () => 1 }, { at: new Date(0), fn: () => 2 }) // → {}

// Ignore paths and customise the leaf comparison
objectUtils.diff(input, initial, {
	output: "flat",
	ignore: (path) => path.startsWith("roles"),
	isEqual: (a, b, path) =>
		path === "address.city" ? String(a).toLowerCase() === String(b).toLowerCase() : objectUtils.isEqualLeaf(a, b),
})
// → { "address.city": { path: "address.city", inputValue: "Paris", initialValue: "London" } }

// Pair rows by id instead of index, so inserting a row doesn't shift the rest
objectUtils.diff(input, initial, {
	onArrayDiff: (inputArray, initialArray, { path }) =>
		path === "roles"
			? (inputArray as Form["roles"]).map((row, index) => ({
					index,
					inputValue: row,
					initialValue: (initialArray as Form["roles"]).find((initialRow) => initialRow.id === row.id),
				}))
			: arrayUtils.diffByIndex(inputArray, initialArray),
})
```

### `DiffOptions`

| Option        | Default                                                                             | Effect                                                                                                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `output`      | `"nested"`                                                                          | `"nested"` mirrors the input (`result.roles[1].label`); `"flat"` is a single-level object keyed by path (`result["roles.1.label"]`).                                                                                                         |
| `onArrayDiff` | [`arrayUtils.diffByIndex`](./array.md#arrayutilsdiffbyindexinputarray-initialarray) | `(inputArray, initialArray, { path }) => ArrayDiffPair[]` — decides which items are compared. Each returned `{ index, inputValue, initialValue }` pair is compared recursively under `path.index`. Indices should be unique (last one wins). |
| `isEqual`     | [`objectUtils.isEqualLeaf`](#objectutilsisequalleafinputvalue-initialvalue)         | `(inputValue, initialValue, path) => boolean` — replaces the leaf comparison. Called only for leaves (primitives, `null`, `undefined`, `Date`), never for structural mismatches. Delegate to `isEqualLeaf` for paths you don't handle.       |
| `ignore`      | —                                                                                   | `(path) => boolean` — returning `true` skips the value at `path` together with its whole subtree.                                                                                                                                            |

### `DiffEntry`

| Field          | Type                  | Description                                                                                   |
| -------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| `path`         | `string`              | Dot-notation path of the value (`"roles.1.label"`) — the same as the key in `output: "flat"`. |
| `inputValue`   | `TValue \| undefined` | Value from `input`; `undefined` if missing there.                                             |
| `initialValue` | `TValue \| undefined` | Value from `initial`; `undefined` if missing there.                                           |

Result types live on the same namespace: `objectUtils.DiffNested<T>` (every node is a `DiffEntry` or a deeper nested
object/array) and `objectUtils.DiffFlat<T>` (keys are the paths of [`FlatObject<T>`](./types.md#flatobjectt), so
`result["roles.1.label"]` is typed as `DiffEntry<string> | undefined`).

---

## `objectUtils.hasDiff(input, initial, options?)`

Returns `true` if `input` differs from `initial`. Same rules and options as
[`objectUtils.diff`](#objectutilsdiffinput-initial-options) (except `output`), but it stops at the first difference and
builds no result — a cheap "is dirty" check.

```ts
objectUtils.hasDiff<T extends object>(input: T, initial: DeepPartial<T>, options?: Omit<DiffOptions, "output">): boolean
```

```ts
objectUtils.hasDiff({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } }) // → false
objectUtils.hasDiff({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } }) // → true
objectUtils.hasDiff({ a: "x" }, { a: "y" }, { ignore: (path) => path === "a" }) // → false
objectUtils.hasDiff({ fn: () => 1 }, { fn: () => 2 }) // → false  (non-serializable values are skipped)
```

---

## `objectUtils.isEqualLeaf(inputValue, initialValue)`

The default leaf comparator of `diff` / `hasDiff`. It's exported so a custom `isEqual` can fall back to it.

```ts
objectUtils.isEqualLeaf(inputValue: unknown, initialValue: unknown): boolean
```

- `Date` instances are compared by timestamp; two invalid dates are equal.
- `NaN` equals `NaN`.
- Everything else uses `===`, so `0` equals `-0` (same as JSON).

```ts
objectUtils.isEqualLeaf(new Date(1000), new Date(1000)) // → true
objectUtils.isEqualLeaf(NaN, NaN) // → true
objectUtils.isEqualLeaf(0, -0) // → true
objectUtils.isEqualLeaf("1", 1) // → false
objectUtils.isEqualLeaf(new Date(1000), 1000) // → false
```

---

## `objectUtils.isDiffEntry(node)`

Type guard for nodes of a nested `diff` result: `true` for a [`DiffEntry`](#diffentry), `false` for a deeper nested
object/array (or `undefined`). It narrows the type in both branches.

```ts
objectUtils.isDiffEntry<TNode>(node: TNode): node is Extract<TNode, DiffEntry>
```

```ts
const result = objectUtils.diff(input, initial)

if (objectUtils.isDiffEntry(result.address)) {
	result.address.inputValue // the whole address differs (e.g. it was added or removed)
} else {
	result.address?.city // the difference is deeper
}
```
