import type { DepthTuple } from "~/types/DepthTuple"
import type { IsOpaque } from "~/types/IsOpaque"
import type { IsPlainObject } from "~/types/IsPlainObject"

/**
 * Extracts only leaf property paths (deepest keys) in dot‑notation.
 *
 * Only `TDepth` nested objects below the root are expanded. Paths below that
 * are still accepted, but typed loosely as `${path}.${string}`.
 *
 * @typeParam TObject - The object type whose leaf paths should be extracted.
 * @typeParam TDepth - How many nested objects below the root are expanded. Defaults to `5`.
 *
 * @example
 * ```tsx
 * type Example = {
 *   a: string;
 *   b: { c: { d: number } };
 * };
 *
 * type Paths = LeafDotPaths<Example>;
 * // "a" | "b.c.d"
 * ```
 */
export type LeafDotPaths<TObject, TDepth extends number = 5> = LeafDotPathsAt<TObject, DepthTuple<TDepth>>

/** `TRemaining` holds one element per nested level that may still be expanded */
type LeafDotPathsAt<TObject, TRemaining extends unknown[]> =
	IsOpaque<TObject> extends true
		? string
		: {
				[TKey in keyof TObject]-?: IsPlainObject<TObject[TKey]> extends true
					? `${TKey & string}.${ChildLeafDotPaths<TObject[TKey], TRemaining>}`
					: TKey & string
			}[keyof TObject]

type ChildLeafDotPaths<TValue, TRemaining extends unknown[]> = TRemaining extends [unknown, ...infer TRest]
	? LeafDotPathsAt<TValue, TRest>
	: string
