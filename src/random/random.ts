export interface RandomOptions {
	excludeMin?: true
	excludeMax?: true
}

/**
 * Returns random integer number between `min` and `max` based on the `options`
 * @param min min value (inclusive by default). Must be less than `max`
 * @param max max value (inclusive by default). Must be greater than `min`
 * @param options further options for modifying generator behavior
 *
 * @example ```tsx
 * random(1, 10)
 * // returns single value from  inclusive interval <1, 10>
 * ```
 */
export function random(min: number, max: number, options?: RandomOptions) {
	if (min === max) {
		return Math.floor(min)
	}

	if (min > max || max < min) {
		throw new Error(`Min must be greater than max. Got min: ${min}, max: ${max}`)
	}

	if (Math.abs(Math.floor(min) - Math.floor(max)) === 1 && options?.excludeMin && options?.excludeMax) {
		throw new Error(`Cannot generate random non-inclusive value from interval (${min}; ${max})`)
	}

	if (options?.excludeMin) {
		return Math.floor(Math.random() * (max - min)) + min + 1
	}

	if (options?.excludeMax) {
		return Math.floor(Math.random() * (max - min)) + min
	}

	return Math.floor(Math.random() * (max - min + 1)) + min
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
 *  // where result will be <89; 121>
 *
 * ```
 * @remark Returns floored random value
 *
 * @param value initial value to be derived
 * @param options fixed values default to 0, percentage values defaults to 1
 */
export function randomMarginalChange(value: number, options: RandomMarginalChangeOptions) {
	const min = (value + (options.minFixed ?? 0)) * (options.minPercentage ?? 1)
	const max = (value + (options.maxFixed ?? 0)) * (options.maxPercentage ?? 1)

	const computedResult = Math.round(random(min, max))
	if (options.absoluteMin && computedResult < options.absoluteMin) {
		return options.absoluteMin
	}
	if (options.absoluteMax && computedResult > options.absoluteMax) {
		return options.absoluteMax
	}

	return computedResult
}
