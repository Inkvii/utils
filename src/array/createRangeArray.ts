/**
 * Returns array of numbers from interval `<min, max>`
 * @param min min value (inclusive)
 * @param max max value (inclusive)
 * @example ```tsx
 * createRangeArray(-2, 1) // [-2, -1, 0, 1]
 * ```
 */
export function createRangeArray(min: number, max: number) {
	return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}
