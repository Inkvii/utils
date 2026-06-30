import type { IsPlainObject } from "~/types/IsPlainObject"

/**
 * Extracts only leaf property paths (deepest keys) in dot‑notation.
 *
 * @typeParam T - The object type whose leaf paths should be extracted.
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
export type LeafDotPaths<TObject> = {
	[TKey in keyof TObject]:
	IsPlainObject<TObject[TKey]> extends true
		? `${TKey & string}.${LeafDotPaths<TObject[TKey]>}`
		: TKey & string
}[keyof TObject];