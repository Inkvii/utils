import { describe, expect, it } from "vitest"
import { createRangeArray } from "~/array/createRangeArray"

describe("createRangeArray", () => {
	it("happy scenario", () => {
		const min = 7
		const max = 12
		const actual = createRangeArray(min, max)

		for (let i = min; i <= max; i++) {
			expect(actual[i - min]).toBe(i)
		}
		expect(actual.length).toBe(max - min + 1)
	})
	it("with single positive value", () => {
		const min = 5
		const max = 5
		const actual = createRangeArray(min, max)

		for (let i = min; i <= max; i++) {
			expect(actual[i - min]).toBe(i)
		}
		expect(actual.length).toBe(1)
	})
	it("with single zero value", () => {
		const min = 0
		const max = 0
		const actual = createRangeArray(min, max)

		for (let i = min; i <= max; i++) {
			expect(actual[i - min]).toBe(i)
		}
		expect(actual.length).toBe(1)
	})
	it("negative to positive range", () => {
		const min = -3
		const max = 3
		const actual = createRangeArray(min, max)

		expect(actual.length).toBe(7)

		expect(actual[0]).toBe(-3)
		expect(actual[1]).toBe(-2)
		expect(actual[2]).toBe(-1)
		expect(actual[3]).toBe(0)
		expect(actual[4]).toBe(1)
		expect(actual[5]).toBe(2)
		expect(actual[6]).toBe(3)
	})
})
