import { isPlainObject } from "~/merge/utils"
import { filterValidPrimitiveArrayValues } from "~/merge/filterValidPrimitiveArrayValues"
import type { IsInvalidPrimitiveOptions } from "~/merge/isInvalidPrimitive"

export interface MergeArraysOptions<TData> extends IsInvalidPrimitiveOptions<TData> {
	/**
	 * If `true` - disables `Set` behavior for array values
	 * @example ```tsx
	 * mergeArrays([["first"], ["first", "second"]], options: { disableDistinctPrimitiveFilter: true })
	 * // output: ["first", "first", "second"]
	 *
	 * mergeArrays([["first"], ["first", "second"]], options: { disableDistinctPrimitiveFilter: false })
	 * // output: ["first", "second"]
	 * ```
	 * @remarks Works only for arrays of primitive values. Doesn't work with objects
	 */
	disableDistinctPrimitiveFilter?: boolean
}

export function mergeArrays<TData>(arrays: TData[][], options?: MergeArraysOptions<TData>) {
	const merged = arrays.flat()

	if (!options?.disableDistinctPrimitiveFilter) {
		const areArraysPrimitive = !merged.some((a) => isPlainObject(a) || Array.isArray(a))

		if (areArraysPrimitive) {
			return filterValidPrimitiveArrayValues(merged, options)
		}
	}
	return merged
}
