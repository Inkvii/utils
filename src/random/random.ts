export interface RandomOptions {
	excludeMin?: true
	excludeMax?: true
}

/**
 * Returns random integer number between `min` and `max` based on the `options`
 * @param min min value (inclusive by default). Must be less than or equal to `max`
 * @param max max value (inclusive by default). Must be greater than or equal to `min`
 * @param options further options for modifying generator behavior
 * @remarks Only integers inside the interval are returned, so `random(1.5, 3)` returns `2` or `3`.
 * Throws if the interval contains no integer, e.g. `random(1.2, 1.8)` or `random(1, 2, { excludeMin: true, excludeMax: true })`
 *
 * @example ```tsx
 * random(1, 10)
 * // returns single value from  inclusive interval <1, 10>
 * ```
 */
export function random(min: number, max: number, options?: RandomOptions) {
	if (min > max) {
		throw new Error(`Min must be less than or equal to max. Got min: ${min}, max: ${max}`)
	}

	const lowest = options?.excludeMin ? Math.floor(min) + 1 : Math.ceil(min)
	const highest = options?.excludeMax ? Math.ceil(max) - 1 : Math.floor(max)

	if (lowest > highest) {
		const interval = `${options?.excludeMin ? "(" : "<"}${min}; ${max}${options?.excludeMax ? ")" : ">"}`
		throw new Error(`Cannot generate random integer from interval ${interval}`)
	}

	return Math.floor(Math.random() * (highest - lowest + 1)) + lowest
}

export interface RandomMarginalChangeOptions {
	/**
	 * Value added to the `min` in the random function
	 * @default 0
	 */
	minFixed?: number
	/**
	 * Value added to the `max` in the random function
	 * @default 0
	 */
	maxFixed?: number
	/**
	 * Percentage value (as decimal) multiplied the resulting `min` in the random function
	 * @default 1.00
	 */
	minPercentage?: number
	/**
	 * Percentage value (as decimal) multiplied the resulting `max` in the random function
	 * @default 1.00
	 */
	maxPercentage?: number
	/**
	 * Return this number if computed result is less than absolute minimum
	 */
	absoluteMin?: number
	/**
	 * Return this number if computed result is greater than absolute maximum
	 */
	absoluteMax?: number
}

/**
 * Takes initial value and creates marginal change based on options values.
 *
 * Insert percentages as decimals - 100% = 1.00; 1% = 0.01 calculated from initial value.
 * @example
 * ```typescript
 *  randomMarginalChange(100, {minFixed: -10, maxFixed: 10, minPercentage: 0.9, maxPercentage: 1.1})
 *  // results in interval  min: (100 - 10) * 0.9; max: (100 + 10) * 1.1
 *  // where result will be <81; 121>
 *
 * ```
 * @remarks Returns random integer from the interval. If the interval contains no integer (e.g. `<100.2; 100.8>`),
 * returns its rounded middle. Bounds are swapped if the computed min is greater than max (e.g. for negative `value`)
 *
 * @param value initial value to be derived
 * @param options fixed values default to 0, percentage values defaults to 1
 */
export function randomMarginalChange(value: number, options: RandomMarginalChangeOptions) {
	const first = (value + (options.minFixed ?? 0)) * (options.minPercentage ?? 1)
	const second = (value + (options.maxFixed ?? 0)) * (options.maxPercentage ?? 1)
	const min = Math.min(first, second)
	const max = Math.max(first, second)

	const computedResult = Math.ceil(min) <= Math.floor(max) ? random(min, max) : Math.round((min + max) / 2)
	if (options.absoluteMin !== undefined && computedResult < options.absoluteMin) {
		return options.absoluteMin
	}
	if (options.absoluteMax !== undefined && computedResult > options.absoluteMax) {
		return options.absoluteMax
	}

	return computedResult
}
