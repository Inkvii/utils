import { isInvalidPrimitive, type IsInvalidPrimitiveOptions } from "~/merge/isInvalidPrimitive"

export type FilterValidPrimitiveArrayValuesOptions = Omit<IsInvalidPrimitiveOptions<never>, "validators">

export function filterValidPrimitiveArrayValues<TData>(
	flatArray: TData[],
	options?: FilterValidPrimitiveArrayValuesOptions
) {
	const result = new Set<TData>()
	for (const item of flatArray) {
		if (isInvalidPrimitive(item, options)) {
			continue
		}
		result.add(item)
	}

	return [...result]
}
