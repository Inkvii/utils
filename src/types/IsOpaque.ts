/**
 * Resolves to `true` for types with no statically known keys (`any`,
 * `unknown`, `object`, `{}`). Such types cannot be walked, so the path types
 * fall back to accepting any string below them instead of producing `never`.
 *
 * @typeParam T - The type being checked.
 */
export type IsOpaque<T> = 0 extends 1 & T
	? true
	: unknown extends T
		? true
		: T extends readonly unknown[]
			? false
			: [keyof T] extends [never]
				? true
				: false
