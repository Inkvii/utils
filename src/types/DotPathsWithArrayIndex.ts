import type { IsPlainObject } from "~/types/IsPlainObject"

/**
 * Recursively builds dot‑notation paths, including numeric indices for arrays.
 *
 * @typeParam T - The object or array type to extract paths from.
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
export type DotPathsWithArrayIndex<TObject> = TObject extends unknown[]
	? TObject extends (infer TElement)[]
		? TElement extends unknown[]
			? `${number}` | `${number}.${DotPathsWithArrayIndex<TElement>}`
			: IsPlainObject<TElement> extends true
				? `${number}` | `${number}.${DotPathsWithArrayIndex<TElement>}`
				: `${number}`
		: never
	: {
			[TKey in keyof TObject]-?: TObject[TKey] extends unknown[]
				? (TKey & string) | `${TKey & string}.${DotPathsWithArrayIndex<TObject[TKey]>}`
				: IsPlainObject<TObject[TKey]> extends true
					? (TKey & string) | `${TKey & string}.${DotPathsWithArrayIndex<TObject[TKey]>}`
					: TKey & string
		}[keyof TObject]


