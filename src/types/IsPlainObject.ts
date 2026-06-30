/**
 * Determines whether a type is a plain object suitable for recursive traversal.
 *
 * A "plain object" in this context means:
 * - It is an object type
 * - It is **not** an array
 * - It is **not** a function
 *
 * This prevents recursion from descending into prototypes of arrays, functions,
 * primitives, or built‑in objects, ensuring that only object literals are walked.
 *
 * @typeParam T - The type being checked.
 * @returns `true` if `TObject` is a non‑array, non‑function object; otherwise `false`.
 */
export type IsPlainObject<TObject> =
	TObject extends object
		? TObject extends unknown[]
			? false
			: TObject extends (...args: unknown[]) => unknown
				? false
				: true
		: false;