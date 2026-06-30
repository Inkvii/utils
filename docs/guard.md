# guard

Type guards and runtime checks: small value predicates used internally by `merge`, plus an exhaustiveness helper for
`switch` statements.

All exports are available from the package root:

```ts
import { triggerExhaustiveSwitch, isPlainObject, isEmptyObject, isEmptyArray, isInvalidNumber } from "@1nkvi/utils"
```

---

## `triggerExhaustiveSwitch(value, componentName)`

Compile-time exhaustiveness check for `switch` statements. Placed in the `default` branch, it forces a type error if any
union member is left unhandled, and throws at runtime if an unexpected value slips through.

```ts
triggerExhaustiveSwitch(value: never, componentName: string): never
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
			return triggerExhaustiveSwitch(test, "My component name")
	}
}
```

---

## Value guards

Type-guards and number checks used internally, exposed for convenience:

| Function             | Signature                                      | Returns `true` when…                                      |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `isPlainObject(v)`   | `(v: unknown) => v is Record<string, unknown>` | `v` is a non-null object that isn't an array              |
| `isEmptyObject(v)`   | `(v: unknown) => v is object`                  | `v` is a plain object with no own keys (`{}`)             |
| `isEmptyArray(v)`    | `(v: unknown) => v is Array<unknown>`          | `v` is an array of length `0` (`[]`)                      |
| `isInvalidNumber(v)` | `(v: unknown) => boolean`                      | `v` is a number that is `NaN` or not finite (`±Infinity`) |

```ts
isPlainObject({ a: 1 }) // → true
isPlainObject([]) // → false
isPlainObject(null) // → false

isEmptyObject({}) // → true
isEmptyObject({ a: 1 }) // → false

isEmptyArray([]) // → true
isEmptyArray([1]) // → false

isInvalidNumber(NaN) // → true
isInvalidNumber(Infinity) // → true
isInvalidNumber(42) // → false
```
