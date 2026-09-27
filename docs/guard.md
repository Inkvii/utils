# guard

Type guards and runtime checks: small value predicates used internally by `merge`, plus an exhaustiveness helper for
`switch` statements.

All exports are available under the `guardUtils` namespace from the package root:

```ts
import { guardUtils } from "@1nkvi/utils"
```

---

## `guardUtils.triggerExhaustiveSwitch(value, componentName)`

Compile-time exhaustiveness check for `switch` statements. Placed in the `default` branch, it forces a type error if any
union member is left unhandled, and throws at runtime if an unexpected value slips through.

```ts
guardUtils.triggerExhaustiveSwitch(value: never, componentName: string): never
```

| Parameter       | Type     | Description                                                                                    |
| --------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `value`         | `never`  | The switched value — typed `never` once all cases are handled.                                 |
| `componentName` | `string` | Name used for debugging, usually where the switch lives. Included in the thrown error message. |

If reached at runtime it throws: `Unhandled <componentName> type for value [<value>]`.

```ts
type Test = "a" | "b" | "c"

function handle(test: Test) {
	switch (test) {
		case "a":
			return 1
		case "b":
			return 2
		// forgetting "c" makes the next line a compile error
		default:
			return guardUtils.triggerExhaustiveSwitch(test, "My component name")
	}
}
```

---

## Value guards

Type-guards and number checks used internally, exposed for convenience:

| Function                        | Signature                                      | Returns `true` when…                                      |
| ------------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `guardUtils.isPlainObject(v)`   | `(v: unknown) => v is Record<string, unknown>` | `v` is an object literal or `Object.create(null)`         |
| `guardUtils.isEmptyObject(v)`   | `(v: unknown) => v is Record<string, never>`   | `v` is a plain object with no own keys (`{}`)             |
| `guardUtils.isEmptyArray(v)`    | `<T>(v: T) => v is … & { length: 0 }`          | `v` is an array of length `0` (`[]`)                      |
| `guardUtils.isInvalidNumber(v)` | `(v: unknown) => boolean`                      | `v` is a number that is `NaN` or not finite (`±Infinity`) |

`isPlainObject` checks the prototype, so arrays, `Date`, `Map`, `Set`, `RegExp`, functions and class instances are not
plain objects. `isEmptyObject` uses it, so an empty `Map` or a `Date` is not an "empty object".

Narrowing of the empty checks:

- `isEmptyObject` narrows to `Record<string, never>`. In the `false` branch the value keeps its original type, so a
  typed object (e.g. a form with optional fields) is still usable after `if (!isEmptyObject(form))`.
- `isEmptyArray` narrows only the array members of `v` to `<array> & { length: 0 }` — `string[]` becomes
  `string[] & { length: 0 }`, `readonly string[] | string | undefined` becomes `readonly string[] & { length: 0 }`, and
  `unknown` becomes `unknown[] & { length: 0 }`. In the `false` branch the type is unchanged (a non-empty array has the
  same type), so the array is still usable afterwards.

```ts
function render(items: string[]) {
	if (guardUtils.isEmptyArray(items)) return "Empty"
	return items.join(", ") // items is still string[]
}
```

```ts
guardUtils.isPlainObject({ a: 1 }) // → true
guardUtils.isPlainObject(Object.create(null)) // → true
guardUtils.isPlainObject([]) // → false
guardUtils.isPlainObject(null) // → false
guardUtils.isPlainObject(new Date()) // → false
guardUtils.isPlainObject(new Map()) // → false

guardUtils.isEmptyObject({}) // → true
guardUtils.isEmptyObject({ a: 1 }) // → false
guardUtils.isEmptyObject(new Map()) // → false

guardUtils.isEmptyArray([]) // → true
guardUtils.isEmptyArray([1]) // → false

guardUtils.isInvalidNumber(NaN) // → true
guardUtils.isInvalidNumber(Infinity) // → true
guardUtils.isInvalidNumber(42) // → false
```
