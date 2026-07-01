# object

Helpers for working with plain objects by dot-notation path.

All exports are available from the package root:

```ts
import { replace } from "@1nkvi/utils"
```

---

## `replace(object, key, value)`

Immutably sets `value` at the dot-notation `key` and returns a **new** object — the input is never mutated. Every
container along the path is cloned (arrays for numeric segments, objects otherwise), so a single element or key is
replaced without touching its siblings.

```ts
replace<TObject, TKey extends keyof FlatObject<TObject> & string>(
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
replace(user, "name", "Ada Lovelace").name // → "Ada Lovelace"

// Replace a nested value — siblings untouched
replace(user, "address.city", "Paris").address // → { city: "Paris", zip: "SW1" }

// Replace one array element field by index
replace(user, "roles.0.label", "admin").roles // → [{ id: 1, label: "admin" }, { id: 2, label: "editor" }]

// Replace a primitive array element
replace(user, "tags.1", "ops").tags // → ["admin", "ops"]

// The input is never mutated
user.name // → "Ada"
```
