import type { IsOpaque } from "~/types/IsOpaque"
import type { IsPlainObject } from "~/types/IsPlainObject"

/**
 * Collapses a union of objects into a single intersected object so that the
 * per‑key results below merge into one flat lookup map instead of a union.
 */
type UnionToIntersection<TUnion> = (TUnion extends unknown ? (arg: TUnion) => void : never) extends (
	arg: infer TIntersection
) => void
	? TIntersection
	: never

/**
 * Produces a flattened object type where keys are dot‑notation paths and
 * values are the corresponding values. Both intermediate paths (objects and
 * arrays) and leaf paths are emitted, so a whole nested object/array can be
 * addressed just as safely as a leaf. Arrays are descended using a generic
 * numeric index (`${bigint}`), so element paths remain type‑safe.
 *
 * @typeParam T - The object type to flatten.
 *
 * @example
 * ```tsx
 * type Example = {
 *   a: string;
 *   b: { c: number };
 *   items: { id: string }[];
 * };
 *
 * type Flat = FlatObject<Example>;
 * // {
 * //   "a": string;
 * //   "b": { c: number };
 * //   "b.c": number;
 * //   "items": { id: string }[];
 * //   [k: `items.${bigint}`]: { id: string };
 * //   [k: `items.${bigint}.id`]: string;
 * // }
 * ```
 */
export type FlatObject<T> =
	IsOpaque<T> extends true
		? Record<string, unknown>
		: T extends readonly (infer TElement)[]
			? IsPlainObject<TElement> extends true
				? { [Index in `${bigint}`]: TElement } & {
						[SubKey in keyof FlatObject<TElement> & string as `${bigint}.${SubKey}`]: FlatObject<TElement>[SubKey]
					}
				: TElement extends readonly unknown[]
					? { [Index in `${bigint}`]: TElement } & {
							[SubKey in keyof FlatObject<TElement> & string as `${bigint}.${SubKey}`]: FlatObject<TElement>[SubKey]
						}
					: { [Index in `${bigint}`]: TElement }
			: FlatObjectFromKeys<Required<T>>

type FlatObjectFromKeys<T> = UnionToIntersection<
	{
		[Key in keyof T & string]: IsPlainObject<T[Key]> extends true
			? { [FlatKey in Key]: T[Key] } & {
					[SubKey in keyof FlatObject<T[Key]> & string as `${Key}.${SubKey}`]: FlatObject<T[Key]>[SubKey]
				}
			: T[Key] extends readonly unknown[]
				? { [FlatKey in Key]: T[Key] } & {
						[SubKey in keyof FlatObject<T[Key]> & string as `${Key}.${SubKey}`]: FlatObject<T[Key]>[SubKey]
					}
				: { [FlatKey in Key]: T[Key] }
	}[keyof T & string]
>
