/**
 * Creates array from `startIndex` to `length¨
 *
 * Useful for quickly creating skeleton placeholders
 *
 * @param length size of the array
 * @param startIndex defaults to 0
 */
export function createArray(length: number, startIndex: number = 0) {
	return Array.from({ length }, (_, i) => i + startIndex)
}
