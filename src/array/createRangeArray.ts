/**
 * Returns array of numbers from interval `<min, max>`
 * @param min min value (inclusive)
 * @param max max value (inclusive)
 */
export function createRangeArray(min: number, max: number) {
	return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}
