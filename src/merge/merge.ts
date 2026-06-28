import { isInvalidPrimitive } from "~/merge/isInvalidPrimitive"
import { isPlainObject } from "~/merge/utils"
import { tuplify } from "~/array/tuplify"
import { mergeArrays, type MergeArraysOptions } from "~/merge/mergeArrays"
import type { DeepPartial } from "~/merge/DeepPartial"

export type MergeOptions<TData> = Omit<MergeArraysOptions<TData>, "validators"> & {
	/**
	 * If `true` - merging  `TValue | TValue[]` results in `TValue[]`
	 * If `falsy` - last value overrides
	 */
	enableSingleValueArrays?: boolean
}

/**
 * Deeply merges inputs into new object. Generally goes through the following steps:
 * 1. gathers keys from all input values
 * 2. for each key, value is either overridden by later input (if primitive value) or joined (if it's array, using distinct set by default for primitive array types) unless `options` state differently
 * 3. if key is object, recursively travel down and repeat step above
 * 4. returned object is always of type `DeepPartial<TData>` as creating new object does not guarantee mandatory fields, but contains keys from all inputs that pass the validation
 *
 * @remarks See tests for more comprehensive behavior
 * @param values inputs to be merged
 * @param options
 */
export function merge<TData extends object>(
	values: DeepPartial<TData>[],
	options?: MergeOptions<TData>
): DeepPartial<TData> {
	return mergeObjects(values as Record<string, unknown>[], options) as DeepPartial<TData>
}

function mergeObjects<TData>(
	objects: Record<string, unknown>[],
	options?: MergeOptions<TData>
): Record<string, unknown> {
	const result: Record<string, unknown> = {}

	const keys = new Set<string>()
	for (const object of objects) {
		if (!isPlainObject(object)) continue
		for (const key of Object.keys(object)) {
			if (key === "__proto__") continue
			keys.add(key)
		}
	}

	for (const key of keys) {
		const valuesForKey = objects
			.filter((object) => isPlainObject(object) && Object.hasOwn(object, key))
			.map((object) => object[key])
			.filter((value) => value !== undefined)

		const merged = mergeValues(valuesForKey, options)
		if (merged !== undefined) result[key] = merged
	}

	return result
}

function mergeValues<TData>(values: unknown[], options?: MergeOptions<TData>): unknown {
	if (values.length === 0) return undefined

	if (values.every(isPlainObject)) {
		return mergeObjects(values, options)
	}

	if (options?.enableSingleValueArrays && values.some((value) => Array.isArray(value))) {
		return mergeArrays(values.map(tuplify), options)
	} else if (values.every((value): value is unknown[] => Array.isArray(value))) {
		return mergeArrays(values, options)
	}

	return values.findLast((v) => !isInvalidPrimitive(v, options))
}
