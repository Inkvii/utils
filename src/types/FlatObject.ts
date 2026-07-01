import type { IsPlainObject } from "~/types/IsPlainObject"

/**
 * Collapses a union of objects into a single intersected object so that the
 * per‑key results below merge into one flat lookup map instead of a union.
 */
type UnionToIntersection<TUnion> = (
	TUnion extends unknown ? (arg: TUnion) => void : never
) extends (arg: infer TIntersection) => void
	? TIntersection
	: never

/**
 * Produces a flattened object type where keys are dot‑notation paths and
 * values are the corresponding values. Both intermediate paths (objects and
 * arrays) and leaf paths are emitted, so a whole nested object/array can be
 * addressed just as safely as a leaf. Arrays are descended using a generic
 * numeric index (`${number}`), so element paths remain type‑safe.
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
 * //   [k: `items.${number}`]: { id: string };
 * //   [k: `items.${number}.id`]: string;
 * // }
 * ```
 */
export type FlatObject<T> = T extends readonly (infer TElement)[]
	? IsPlainObject<TElement> extends true
		? { [Index in `${number}`]: TElement } & {
				[SubKey in keyof FlatObject<TElement> & string as `${number}.${SubKey}`]: FlatObject<TElement>[SubKey]
			}
		: TElement extends readonly unknown[]
			? { [Index in `${number}`]: TElement } & {
					[SubKey in keyof FlatObject<TElement> & string as `${number}.${SubKey}`]: FlatObject<TElement>[SubKey]
				}
			: { [Index in `${number}`]: TElement }
	: UnionToIntersection<
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
