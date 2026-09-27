# types

Utility types for working with nested objects (deep partials, dot-notation path unions, object flattening) plus a
string-literal autocomplete helper. These are **type-only** — import them with `import type` and use them in type
positions; they have no runtime value.

```ts
import type {
	DeepPartial,
	DotPaths,
	DotPathsWithArrayIndex,
	FlatObject,
	IsOpaque,
	IsPlainObject,
	LeafDotPaths,
	LooseString,
	PathValue,
} from "@1nkvi/utils"
```

---

## `DeepPartial<T>`

Recursively makes every key of an object (and of nested objects/arrays) optional. Used as the input and output type of
[`mergeUtils.merge`](./merge.md#mergeutilsmergevalues-options).

```ts
type Config = { db: { host: string; port: number }; tags: string[] }

type PartialConfig = DeepPartial<Config>
// {
//   db?: { host?: string; port?: number };
//   tags?: string[];
// }
```

---

## `IsPlainObject<T>`

Resolves to `true` if `T` is a plain object suitable for recursive traversal; otherwise `false`. Primitives, arrays
(mutable and readonly, including tuples), functions, constructors and built-ins with internal state (`Date`, `RegExp`,
`Error`, `Map`, `Set`, `WeakMap`, `WeakSet`, `Promise`) are not plain objects, so only object literals are walked. Used
internally by the dot-path types.

Class instances cannot be told apart from object literals at the type level, so they still resolve to `true`.

```ts
IsPlainObject<{ a: 1 }> // → true
IsPlainObject<Record<string, number>> // → true
IsPlainObject<string[]> // → false
IsPlainObject<readonly string[]> // → false
IsPlainObject<() => void> // → false
IsPlainObject<Date> // → false
IsPlainObject<Map<string, number>> // → false
IsPlainObject<string> // → false
```

---

## `IsOpaque<T>`

Resolves to `true` for types with no statically known keys (`any`, `unknown`, `object`, `{}`); otherwise `false`. Such
types cannot be walked, so the dot-path types use it to fall back to accepting any string below them instead of
producing `never`.

```ts
IsOpaque<any> // → true
IsOpaque<unknown> // → true
IsOpaque<object> // → true
IsOpaque<{}> // → true
IsOpaque<{ a: 1 }> // → false
IsOpaque<string[]> // → false
```

---

## `DotPaths<T>`

Builds a union of all nested property paths in dot-notation, including every intermediate object path as well as its
leaves. Only [plain objects](#isplainobjectt) are traversed; primitives, arrays, functions and built-ins such as `Date`
or `Map` produce their key directly without recursion (so `"date.getTime"` or `"tags.length"` are not paths).

```ts
type Example = { a: string; b: { c: { d: number } } }

type Paths = DotPaths<Example>
// "a" | "b" | "b.c" | "b.c.d"
```

Types without statically known keys (`object`, `{}`, `unknown`, `any`) cannot be walked, so they fall back to `string` —
at the top level and below an opaque nested field. This applies to `LeafDotPaths` and `DotPathsWithArrayIndex` too.

```ts
type Paths = DotPaths<{ a: string; meta: object }>
// "a" | "meta" | `meta.${string}`
```

An optional second parameter `TDepth` (default `5`) limits how many nested objects below the root are expanded. Paths
below that are still accepted, but typed loosely as `` `${path}.${string}` ``. This keeps recursive types (e.g. trees)
from expanding forever, and applies to `LeafDotPaths`, `DotPathsWithArrayIndex` (which also counts arrays as a level)
and [`FlatObject`](#flatobjectt) too.

```ts
type Example = { a: { b: { c: string } } }

type Paths = DotPaths<Example, 1>
// "a" | "a.b" | `a.b.${string}`
```

---

## `LeafDotPaths<T>`

Like `DotPaths`, but yields **only** leaf paths (the deepest keys) — intermediate object keys such as `"b"` and `"b.c"`
are not emitted on their own.

```ts
type Example = {
	a: string
	b: { c: { d: number } }
}

type Paths = LeafDotPaths<Example>
// "a" | "b.c.d"
```

---

## `DotPathsWithArrayIndex<T>`

Like `DotPaths`, but also descends into arrays, emitting a generic integer index (`${bigint}`) for each array segment.
Works with plain and readonly arrays, not just tuples. Non-integer segments such as `"users.1.5"` are rejected; negative
and hex indices still type-check.

```ts
type Example = {
	users: { name: string }[]
}

type Paths = DotPathsWithArrayIndex<Example>
// "users" | `users.${bigint}` | `users.${bigint}.name`
```

---

## `FlatObject<T>`

Produces a flattened object type where keys are dot-notation paths and values are the value at that path. Both
intermediate paths (objects and arrays) and leaf paths are emitted, and arrays are descended with a generic numeric
index (`${bigint}`), so a whole nested object/array can be addressed as safely as a leaf. Using `${bigint}` rather than
`${number}` means only integer segments address elements — `"items.1.5"` is rejected, and in nested arrays
`"matrix.0.1"` resolves to the element, not an intersection of both depths. Negative (`"items.-1"`) and hex
(`"items.0x1"`) indices still type-check, as a template literal cannot exclude them. Used by
[`objectUtils.replace`](./object.md#objectutilsreplaceobject-key-value) and
[`objectUtils.get`](./object.md#objectutilsgetobject-key) to type their `key`.

Types without statically known keys (`object`, `{}`, `unknown`, `any`) cannot be flattened and fall back to
`Record<string, unknown>` — any string path is accepted and its value is `unknown`. The same applies below an opaque
nested field, e.g. `"meta.x"` on `{ meta: object }`.

Numeric keys (`Record<number, T>`, `{ 1: T }`) are emitted as `${bigint}` segments, same as array indices. Keys of a
`Record<string, T>` are emitted as `` `byId.${string}` ``, which also matches every deeper path — so indexing
`FlatObject<T>["byId.1.value"]` resolves to the record value `T`, not the type of `value`. Use
[`PathValue`](#pathvaluet-tpath) for the exact type at a path.

```ts
type Example = {
	a: string
	b: { c: number }
	items: { id: string }[]
}

type Flat = FlatObject<Example>
// {
//   "a": string;
//   "b": { c: number };
//   "b.c": number;
//   "items": { id: string }[];
//   [k: `items.${bigint}`]: { id: string };
//   [k: `items.${bigint}.id`]: string;
// }
```

Only `TDepth` (default `5`) nested objects/arrays below the root are expanded; deeper paths are accepted as
`` `${path}.${string}` `` with value `unknown`. [`PathValue`](#pathvaluet-tpath) still resolves their exact type.

```ts
type Folder = { name: string; children: Folder[] }

type FlatFolder = FlatObject<Folder, 1>
// {
//   "name": string;
//   "children": Folder[];
//   [k: `children.${bigint}`]: Folder;
//   [k: `children.${bigint}.${string}`]: unknown;
// }
```

---

## `PathValue<T, TPath>`

Resolves the type of the value at the dot-notation path `TPath` by splitting it on `.` and walking `T` one segment at a
time. Used by [`objectUtils.get`](./object.md#objectutilsgetobject-key) for its return type and by
[`objectUtils.replace`](./object.md#objectutilsreplaceobject-key-value) for its `value`. Unlike indexing
[`FlatObject`](#flatobjectt), it stays exact below a `Record<string, T>` and has no depth limit.

- Optional keys resolve to their type without `undefined`, same as `FlatObject`.
- Array elements are addressed by integer segments (`${bigint}`); numeric segments also address numeric keys
  (`Record<number, T>`, `{ 1: T }`).
- Unknown segments, segments below a primitive, opaque types (`object`, `unknown`, `any`) and a non-literal `string`
  path resolve to `unknown`.

```ts
type Example = {
	byId: Record<string, { id: number; tags: string[] }>
	settings?: { theme: string }
}

type A = PathValue<Example, "byId.1"> // → { id: number; tags: string[] }
type B = PathValue<Example, "byId.1.tags.0"> // → string
type C = PathValue<Example, "settings.theme"> // → string
type D = PathValue<Example, "nope"> // → unknown
```

---

## `LooseString<TType>`

A union of a string-literal type `TType` and `string`, so any string is still assignable while editors keep offering the
known literals as autocomplete suggestions. Written as `TType | (string & {})` — the `& {}` keeps the literal members
from being absorbed into the wider `string` type.

```ts
type Theme = "dark" | "light"

const known: LooseString<Theme> = "dark" // autocompletes "dark" | "light"
const custom: LooseString<Theme> = "system" // any other string is still allowed
```
