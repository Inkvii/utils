import type { DepthTuple } from "~/types/DepthTuple"
import type { IsOpaque } from "~/types/IsOpaque"
import type { IsPlainObject } from "~/types/IsPlainObject"

/**
 * Recursively builds dot‑notation paths, including numeric indices for arrays.
 *
 * Only `TDepth` nested objects/arrays below the root are expanded. Paths below
 * that are still accepted, but typed loosely as `${path}.${string}`.
 *
 * @typeParam TObject - The object or array type to extract paths from.
 * @typeParam TDepth - How many nested objects/arrays below the root are expanded. Defaults to `5`.
 *
 * @example
 * ```tsx
 * type Example = {
 *   users: [
 *     { name: string }
 *   ];
 * };
 *
 * type Paths = DotPathsWithArrayIndex<Example>;
 * // "users" | "users.0" | "users.0.name"
 * ```
 */
export type DotPathsWithArrayIndex<TObject, TDepth extends number = 5> = DotPathsWithArrayIndexAt<
	TObject,
	DepthTuple<TDepth>
>

/** `TRemaining` holds one element per nested level that may still be expanded */
type DotPathsWithArrayIndexAt<TObject, TRemaining extends unknown[]> =
	IsOpaque<TObject> extends true
		? string
		: TObject extends unknown[]
			? TObject extends (infer TElement)[]
				? TElement extends unknown[]
					? `${bigint}` | `${bigint}.${ChildPaths<TElement, TRemaining>}`
					: IsPlainObject<TElement> extends true
						? `${bigint}` | `${bigint}.${ChildPaths<TElement, TRemaining>}`
						: `${bigint}`
				: never
			: {
					[TKey in keyof TObject]-?: TObject[TKey] extends unknown[]
						? (TKey & string) | `${TKey & string}.${ChildPaths<TObject[TKey], TRemaining>}`
						: IsPlainObject<TObject[TKey]> extends true
							? (TKey & string) | `${TKey & string}.${ChildPaths<TObject[TKey], TRemaining>}`
							: TKey & string
				}[keyof TObject]

type ChildPaths<TValue, TRemaining extends unknown[]> = TRemaining extends [unknown, ...infer TRest]
	? DotPathsWithArrayIndexAt<TValue, TRest>
	: string
