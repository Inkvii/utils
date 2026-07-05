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
	IsPlainObject,
	LeafDotPaths,
	LooseString,
} from "@1nkvi/utils"
```

---

## `DeepPartial<T>`

Recursively makes every key of an object (and of nested objects/arrays) optional. Used as the input and output type of
[`merge`](./merge.md#mergevalues-options).

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

Resolves to `true` if `T` is a non-array, non-function object; otherwise `false`. Prevents recursion from descending
into arrays, functions, or built-in objects, so only object literals are walked. Used internally by the dot-path types.

```ts
IsPlainObject<{ a: 1 }> // → true
IsPlainObject<string[]> // → false
IsPlainObject<() => void> // → false
IsPlainObject<string> // → false
```

---

## `DotPaths<T>`

Builds a union of all nested property paths in dot-notation, including every intermediate object path as well as its
leaves. Only plain objects are traversed; primitives, arrays, and functions produce their key directly without
recursion.

```ts
type Example = { a: string; b: { c: { d: number } } }

type Paths = DotPaths<Example>
// "a" | "b" | "b.c" | "b.c.d"
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

Like `DotPaths`, but also descends into arrays, emitting a generic numeric index (`${number}`) for each array segment.
Works with plain arrays, not just tuples.

```ts
type Example = {
	users: { name: string }[]
}

type Paths = DotPathsWithArrayIndex<Example>
// "users" | `users.${number}` | `users.${number}.name`
```

---

## `FlatObject<T>`

Produces a flattened object type where keys are dot-notation paths and values are the value at that path. Both
intermediate paths (objects and arrays) and leaf paths are emitted, and arrays are descended with a generic numeric
index (`${number}`), so a whole nested object/array can be addressed as safely as a leaf. Used by
[`replace`](./object.md#replaceobject-key-value) to type its `key` and `value`.

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
//   [k: `items.${number}`]: { id: string };
//   [k: `items.${number}.id`]: string;
// }
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
