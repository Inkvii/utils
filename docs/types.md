# types

Utility types for working with nested objects: deep partials, dot-notation path unions, and object flattening. These are
**type-only** — import them with `import type` and use them in type positions; they have no runtime value.

```ts
import type {
	DeepPartial,
	DotPaths,
	DotPathsWithArrayIndex,
	FlatObject,
	IsPlainObject,
	LeafDotPaths,
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

Builds a union of all nested property paths in dot-notation. Only plain objects are traversed; primitives, arrays, and
functions produce their key directly without recursion.

```ts
type Example = { a: string; b: { c: { d: number } } }

type Paths = DotPaths<Example>
// "a" | "b.c.d"
```

---

## `LeafDotPaths<T>`

Like `DotPaths`, but yields only leaf paths (the deepest keys). For the structures in these examples the result matches
`DotPaths`, since intermediate object keys are not emitted on their own.

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

Builds dot-notation paths that also descend into arrays, emitting numeric indices along the way.

```ts
type Example = {
	users: [{ name: string }]
}

type Paths = DotPathsWithArrayIndex<Example>
// "users" | "users.0" | "users.0.name"
```

---

## `FlatObject<T>`

Produces a flattened object type where keys are dot-notation paths and values are the corresponding leaf values.

```ts
type Example = {
	a: string
	b: { c: number }
}

type Flat = FlatObject<Example>
// {
//   "a": string;
//   "b.c": number;
// }
```
