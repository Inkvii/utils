import { random, randomMarginalChange, type RandomOptions } from "./random"
import { describe, expect, it } from "vitest"
import { createFromRange } from "~/array/createFromRange"

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
		).toThrow(`Cannot generate random integer from interval (1; 2)`)
	})

	it.each<{ min: number; max: number; options?: RandomOptions; interval: string }>([
		{ min: 0, max: 0, options: { excludeMin: true, excludeMax: true }, interval: "(0; 0)" },
		{ min: 0, max: 0, options: { excludeMax: true }, interval: "<0; 0)" },
		{ min: 0, max: 0, options: { excludeMin: true }, interval: "(0; 0>" },
		{ min: 1.2, max: 1.8, interval: "<1.2; 1.8>" },
		{ min: 1, max: 1.5, options: { excludeMin: true }, interval: "(1; 1.5>" },
	])("Interval $interval without integer should throw error", ({ min, max, options, interval }) => {
		expect(() => random(min, max, options)).toThrow(`Cannot generate random integer from interval ${interval}`)
	})

	it.each<{ min: number; max: number; options?: RandomOptions; expected: number[] }>([
		{ min: 1.5, max: 3, expected: [2, 3] },
		{ min: -1.5, max: 1.5, expected: [-1, 0, 1] },
		{ min: 1.5, max: 3.5, options: { excludeMin: true, excludeMax: true }, expected: [2, 3] },
	])("Non-integer interval <$min; $max> returns only integers $expected", ({ min, max, options, expected }) => {
		const seen = new Set<number>()
		for (let i = 0; i < 1000 && seen.size < expected.length; i++) {
			const actual = random(min, max, options)
			expect(expected).toContain(actual)
			seen.add(actual)
		}
		expect([...seen].sort((a, b) => a - b)).toStrictEqual(expected)
	})

	it.each([
		{ min: 1, max: 0 },
		{ min: 100, max: 99 },
		{ min: 100, max: -20 },
		{ min: 20, max: 1 },
		{ min: -20, max: -21 },
		{ min: 0, max: -1 },
	])("Error should be thrown for min: $min and max: $max", ({ min, max }) => {
		expect(() => random(min, max)).toThrow(`Min must be less than or equal to max. Got min: ${min}, max: ${max}`)
	})

	it.each<{ min: number; max: number; options?: RandomOptions }>([
		{ min: -2, max: 2, options: {} },
		{ min: -2, max: 2, options: undefined },
		{ min: -2, max: 2, options: { excludeMin: true } },
		{ min: -2, max: 2, options: { excludeMax: true } },
		{ min: -2, max: 2, options: { excludeMin: true, excludeMax: true } },
		{ min: 0, max: 2, options: { excludeMin: true, excludeMax: true } },
		{ min: 1, max: 5, options: { excludeMin: true, excludeMax: true } },
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

			expect(distribution.has(actual)).toBe(true)
			distribution.set(actual, (distribution.get(actual) ?? 0) + 1)

			if ([...distribution.values()].every((value) => value > 0)) {
				console.debug(`Test took ${i + 1} iterations`)
				// no need to continue further, all numbers are verified
				break
			}
		}

		printDistribution(distribution)
		expect([...distribution.values()].every((value) => value > 0)).toBe(true)
	})
})

describe("createRange", () => {
	it("Should create range -2 to 2 inclusive", () => {
		const expected = [-2, -1, 0, 1, 2]
		const actual = createFromRange(-2, 2)

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

	it("Should stay within the documented interval <81; 121>", () => {
		for (let i = 0; i < 100; i++) {
			const actual = randomMarginalChange(100, { minFixed: -10, maxFixed: 10, minPercentage: 0.9, maxPercentage: 1.1 })
			expect(Number.isInteger(actual)).toBe(true)
			expect(actual).toBeGreaterThanOrEqual(81)
			expect(actual).toBeLessThanOrEqual(121)
		}
	})

	it("Should swap bounds for negative value", () => {
		for (let i = 0; i < 100; i++) {
			const actual = randomMarginalChange(-100, { minPercentage: 0.9, maxPercentage: 1.1 })
			expect(actual).toBeGreaterThanOrEqual(-110)
			expect(actual).toBeLessThanOrEqual(-90)
		}
	})

	it("Should respect zero absolute bounds", () => {
		expect(randomMarginalChange(-5, { absoluteMin: 0 })).toBe(0)
		expect(randomMarginalChange(5, { absoluteMax: 0 })).toBe(0)
	})

	it("Should return rounded middle if interval contains no integer", () => {
		expect(randomMarginalChange(100.5, {})).toBe(101)
		expect(randomMarginalChange(100, { minFixed: 0.2, maxFixed: 0.4 })).toBe(100)
	})
})

function initializeDistribution(min: number, max: number) {
	const distribution = new Map<number, number>()
	for (const number of createFromRange(min, max)) {
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
