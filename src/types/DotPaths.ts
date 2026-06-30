import type { IsPlainObject } from "~/types/IsPlainObject"

/**
 * Recursively builds a union of all nested property paths in dot‑notation.
 * Only plain objects are traversed; primitives, arrays, and functions
 * produce their key directly without recursion.
 *
 * @example ```tsx
 *   { a: string, b: { c: { d: number } } }
 *   // "a" | "b.c.d"
 * ```
 */
export type DotPaths<TObject> = {
	[TKey in keyof TObject]: IsPlainObject<TObject[TKey]> extends true
		? `${TKey & string}.${DotPaths<TObject[TKey]>}`
		: TKey & string
}[keyof TObject]
