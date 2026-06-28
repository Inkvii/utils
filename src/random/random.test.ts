import { random, randomMarginalChange, type RandomOptions } from "./random"
import { describe, expect, it } from "vitest"
import { createRangeArray } from "~/array/createRangeArray"

describe("random", () => {
	it.each([
		{ min: 0, max: 0 },
		{ min: 0, max: 1 },
		{ min: 1, max: 2 },
		{ min: 1, max: 1 },
		{ min: 1, max: 10 },
		{ min: -2, max: 2 },
		{ min: -20, max: -2 },
		{ min: -0, max: 0 },
	])("Random between $min and $max", ({ min, max }) => {
		const distribution = initializeDistribution(min, max)

		const MAX_ITERATIONS = 100

		for (let i = 0; i < MAX_ITERATIONS; i++) {
			const actual = random(min, max)

			distribution.set(actual, (distribution.get(actual) ?? 0) + 1)

			expect(actual).toBeGreaterThanOrEqual(min)
			expect(actual).toBeLessThanOrEqual(max)

			if ([...distribution.values()].every((value) => value > 0)) {
				console.debug(`Test took ${i + 1} iterations`)
				// no need to continue further, all numbers are verified
				break
			}
		}

		printDistribution(distribution)

		expect(distribution.get(min)).toBeGreaterThan(0)
		expect(distribution.get(max)).toBeGreaterThan(0)
	})

	it("Non-inclusive interval (1; 2) should throw error", () => {
		expect(() =>
			random(1, 2, {
				excludeMin: true,
				excludeMax: true,
			})
		).toThrow(`Cannot generate random non-inclusive value from interval (1; 2)`)
	})

	it.each([
		{ min: 1, max: 0 },
		{ min: 100, max: 99 },
		{ min: 100, max: -20 },
		{ min: 20, max: 1 },
		{ min: -20, max: -21 },
		{ min: 0, max: -1 },
	])("Error should be thrown for min: $min and max: $max", ({ min, max }) => {
		expect(() => random(min, max)).toThrow(`Min must be greater than max. Got min: ${min}, max: ${max}`)
	})

	it.each<{ min: number; max: number; options?: RandomOptions }>([
		{ min: -2, max: 2, options: {} },
		{ min: -2, max: 2, options: undefined },
		{ min: -2, max: 2, options: { excludeMin: true } },
		{ min: -2, max: 2, options: { excludeMax: true } },
		{ min: -2, max: 2, options: { excludeMin: true, excludeMax: true } },
		{ min: 0, max: 0, options: { excludeMin: true, excludeMax: true } },
		{ min: 0, max: 0, options: { excludeMax: true } },
		{ min: 0, max: 0, options: { excludeMin: true } },
		{ min: 0, max: 2, options: { excludeMin: true, excludeMax: true } },
		{ min: 0, max: 1, options: { excludeMax: true } },
		{ min: 0, max: 1, options: { excludeMin: true } },
	])("Random between $min and $max with $options", ({ min, max, options }) => {
		const distribution = initializeDistribution(min, max)
		if (options?.excludeMin) {
			distribution.delete(min)
		}
		if (options?.excludeMax) {
			distribution.delete(max)
		}

		const MAX_ITERATIONS = 1000

		for (let i = 0; i < MAX_ITERATIONS; i++) {
			const actual = random(min, max, options)

			distribution.set(actual, (distribution.get(actual) ?? 0) + 1)

			expect(actual).toBeGreaterThanOrEqual(min)
			expect(actual).toBeLessThanOrEqual(max)

			if ([...distribution.values()].every((value) => value > 0)) {
				console.debug(`Test took ${i + 1} iterations`)
				// no need to continue further, all numbers are verified
				break
			}
		}

		printDistribution(distribution)
	})
})

describe("createRange", () => {
	it("Should create range -2 to 2 inclusive", () => {
		const expected = [-2, -1, 0, 1, 2]
		const actual = createRangeArray(-2, 2)

		expect(actual).toStrictEqual(expected)
	})
})

describe("randomMarginalChange", () => {
	it("Should create upwards trend", () => {
		let actual = 100

		for (let i = 0; i < 100; i++) {
			actual = randomMarginalChange(actual, { minFixed: 2, minPercentage: 0.9, maxPercentage: 1.1, absoluteMin: 10 })
		}

		expect(actual).toBeGreaterThanOrEqual(10)
	})
})

function initializeDistribution(min: number, max: number) {
	const distribution = new Map<number, number>()
	for (const number of createRangeArray(min, max)) {
		distribution.set(number, 0)
	}
	return distribution
}

function printDistribution(distribution: Map<number, number>) {
	let message = ""
	for (const [key, count] of [...distribution.entries()].sort((a, b) => a[0] - b[0])) {
		message += `\nKey: ${key} appeared ${count} times`
	}
	console.debug(message)
}
