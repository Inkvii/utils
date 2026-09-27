/**
 * Object types that are never walked: arrays (also readonly), functions (with any parameters), constructors and the
 * built‑ins with internal state.
 */
type NonPlainObject =
	| readonly unknown[]
	| ((...args: never[]) => unknown)
	| (abstract new (...args: never[]) => unknown)
	| Date
	| RegExp
	| Error
	| ReadonlyMap<unknown, unknown>
	| ReadonlySet<unknown>
	| WeakMap<object, unknown>
	| WeakSet<object>
	| PromiseLike<unknown>

/**
 * Determines whether a type is a plain object suitable for recursive traversal.
 *
 * A "plain object" in this context means:
 * - It is an object type
 * - It is **not** an array (mutable or readonly)
 * - It is **not** a function or a constructor
 * - It is **not** a built‑in such as `Date`, `RegExp`, `Error`, `Map`, `Set`, `WeakMap`, `WeakSet` or `Promise`
 *
 * This prevents recursion from descending into prototypes of arrays, functions,
 * primitives, or built‑in objects, ensuring that only object literals are walked.
 *
 * @remarks Class instances cannot be told apart from object literals at the type level, so they are still walked.
 * @typeParam T - The type being checked.
 * @returns `true` if `TObject` is a plain object; otherwise `false`.
 */
export type IsPlainObject<TObject> = TObject extends object ? (TObject extends NonPlainObject ? false : true) : false
