/**
 * Tuple of length `TDepth`. Path types (e.g. {@link FlatObject}, {@link DotPaths}) remove one element per nested
 * level and stop expanding once it is empty.
 * @internal
 */
export type DepthTuple<TDepth extends number, TTuple extends unknown[] = []> = TTuple["length"] extends TDepth
	? TTuple
	: DepthTuple<TDepth, [...TTuple, unknown]>
