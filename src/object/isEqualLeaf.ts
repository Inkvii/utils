/**
 * Default leaf comparator used by {@link diff} and {@link hasDiff}.
 * - `Date` instances are compared by their timestamp (two invalid dates are equal)
 * - `NaN` equals `NaN`
 * - everything else is compared with `===` (so `0` equals `-0`, same as in JSON)
 *
 * @example isEqualLeaf(new Date(0), new Date(0)) // -> true
 * @example isEqualLeaf(NaN, NaN) // -> true
 * @example isEqualLeaf("1", 1) // -> false
 */
export function isEqualLeaf(inputValue: unknown, initialValue: unknown): boolean {
	if (inputValue instanceof Date && initialValue instanceof Date) {
		return Object.is(inputValue.getTime(), initialValue.getTime())
	}
	if (inputValue === initialValue) return true
	return isNaNNumber(inputValue) && isNaNNumber(initialValue)
}

function isNaNNumber(value: unknown): boolean {
	return typeof value === "number" && Number.isNaN(value)
}
