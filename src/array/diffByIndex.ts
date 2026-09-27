/**
 * A single pair of array items that should be compared against each other.
 */
export interface ArrayDiffPair {
	/**
	 * Index used as the path segment in the diff output (e.g. `items.3`)
	 * @remarks Should be unique within one array. If it repeats, the last reported difference wins.
	 */
	index: number
	/** Item from the input array. `undefined` if the item exists only in the initial array */
	inputValue: unknown
	/** Item from the initial array. `undefined` if the item exists only in the input array */
	initialValue: unknown
}

export interface ArrayDiffContext {
	/** Dot‑notation path of the compared array */
	path: string
}

/**
 * Decides which items of two arrays are compared against each other. The returned pairs are then compared
 * recursively, the same way as object values.
 */
export type ArrayDiffHandler = (
	inputArray: readonly unknown[],
	initialArray: readonly unknown[],
	context: ArrayDiffContext
) => ArrayDiffPair[]

/**
 * Pairs array items by their index. The longer array decides the number of pairs, so the missing side is `undefined`.
 *
 * @remarks Inserting or removing an item in the middle of an array shifts all subsequent items, so they are all
 * reported as different.
 * @example diffByIndex(["a", "b"], ["a"])
 * // -> [{ index: 0, inputValue: "a", initialValue: "a" }, { index: 1, inputValue: "b", initialValue: undefined }]
 */
export function diffByIndex(inputArray: readonly unknown[], initialArray: readonly unknown[]): ArrayDiffPair[] {
	const length = Math.max(inputArray.length, initialArray.length)
	return Array.from({ length }, (_, index) => ({
		index,
		inputValue: inputArray[index],
		initialValue: initialArray[index],
	}))
}
