import type { IsOpaque } from "~/types/IsOpaque"
import type { DepthTuple } from "~/types/DepthTuple"
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
 * Only `TDepth` nested objects/arrays below the root are expanded. Paths below
 * that are still accepted, but typed loosely as `${path}.${string}` →
 * `unknown`. This keeps recursive types (e.g. trees) from expanding forever.
 *
 * @typeParam T - The object type to flatten.
 * @typeParam TDepth - How many nested objects/arrays below the root are expanded. Defaults to `5`.
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
 *
 * type Folder = { name: string; children: Folder[] };
 *
 * type FlatFolder = FlatObject<Folder, 1>;
 * // {
 * //   "name": string;
 * //   "children": Folder[];
 * //   [k: `children.${bigint}`]: Folder;
 * //   [k: `children.${bigint}.${string}`]: unknown;
 * // }
 * ```
 */
export type FlatObject<T, TDepth extends number = 5> = FlatObjectAt<T, DepthTuple<TDepth>>

/** `TRemaining` holds one element per nested level that may still be expanded */
type FlatObjectAt<T, TRemaining extends unknown[]> =
	IsOpaque<T> extends true
		? Record<string, unknown>
		: T extends readonly (infer TElement)[]
			? IsPlainObject<TElement> extends true
				? { [Index in `${bigint}`]: TElement } & ChildPaths<`${bigint}`, TElement, TRemaining>
				: TElement extends readonly unknown[]
					? { [Index in `${bigint}`]: TElement } & ChildPaths<`${bigint}`, TElement, TRemaining>
					: { [Index in `${bigint}`]: TElement }
			: FlatObjectFromKeys<Required<T>, TRemaining>

type FlatObjectFromKeys<T, TRemaining extends unknown[]> = UnionToIntersection<
	{
		[Key in keyof T & string]: IsPlainObject<T[Key]> extends true
			? { [FlatKey in Key]: T[Key] } & ChildPaths<Key, T[Key], TRemaining>
			: T[Key] extends readonly unknown[]
				? { [FlatKey in Key]: T[Key] } & ChildPaths<Key, T[Key], TRemaining>
				: { [FlatKey in Key]: T[Key] }
	}[keyof T & string]
>

/**
 * Paths inside the nested object/array `TValue` found at `TPrefix`. Descending
 * into it uses up one level of depth; once none is left, only a loose
 * `${TPrefix}.${string}` → `unknown` path is emitted.
 */
type ChildPaths<TPrefix extends string, TValue, TRemaining extends unknown[]> = TRemaining extends [
	unknown,
	...infer TRest,
]
	? {
			[SubKey in keyof FlatObjectAt<TValue, TRest> & string as `${TPrefix}.${SubKey}`]: FlatObjectAt<
				TValue,
				TRest
			>[SubKey]
		}
	: { [Path in `${TPrefix}.${string}`]: unknown }
