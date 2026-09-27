import type { DepthTuple } from "~/types/DepthTuple"
import type { IsOpaque } from "~/types/IsOpaque"
import type { IsPlainObject } from "~/types/IsPlainObject"

/**
 * Recursively builds a union of all nested property paths in dot‑notation.
 * Only plain objects are traversed; primitives, arrays, and functions
 * produce their key directly without recursion.
 *
 * Only `TDepth` nested objects below the root are expanded. Paths below that
 * are still accepted, but typed loosely as `${path}.${string}`.
 *
 * @typeParam TObject - The object type to extract paths from.
 * @typeParam TDepth - How many nested objects below the root are expanded. Defaults to `5`.
 *
 * @example ```tsx
 *   { a: string, b: { c: { d: number } } }
 *   // "a" | "b" | "b.c" | "b.c.d"
 * ```
 */
export type DotPaths<TObject, TDepth extends number = 5> = DotPathsAt<TObject, DepthTuple<TDepth>>

/** `TRemaining` holds one element per nested level that may still be expanded */
type DotPathsAt<TObject, TRemaining extends unknown[]> =
	IsOpaque<TObject> extends true
		? string
		: {
				[TKey in keyof TObject]-?: IsPlainObject<TObject[TKey]> extends true
					? (TKey & string) | `${TKey & string}.${ChildDotPaths<TObject[TKey], TRemaining>}`
					: TKey & string
			}[keyof TObject]

type ChildDotPaths<TValue, TRemaining extends unknown[]> = TRemaining extends [unknown, ...infer TRest]
	? DotPathsAt<TValue, TRest>
	: string
