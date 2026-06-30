import type { IsPlainObject } from "~/types/IsPlainObject"

/**
 * Produces a flattened object type where keys are dot‑notation paths
 * and values are the corresponding leaf values.
 *
 * @typeParam T - The object type to flatten.
 *
 * @example
 * ```tsx
 * type Example = {
 *   a: string;
 *   b: { c: number };
 * };
 *
 * type Flat = FlatObject<Example>;
 * // {
 * //   "a": string;
 * //   "b.c": number;
 * // }
 * ```
 */
export type FlatObject<T> = {
	[Key in keyof T & string]:
	IsPlainObject<T[Key]> extends true
		? {
			[SubKey in keyof FlatObject<T[Key]> & string as `${Key}.${SubKey}`]:
			FlatObject<T[Key]>[SubKey]
		}
		: { [FlatKey in Key]: T[Key] }
}[keyof T & string];