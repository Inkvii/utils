import { describe, expect, it } from "vitest"
import { createArray } from "@/src"

describe("createArray", () => {
	it("Creates an array with index as its value", () => {
		const actual = createArray(5)
		expect(actual.length).toBe(5)
		expect(actual.every((v) => v !== undefined)).toBe(true)

		actual.forEach((v, i) => {
			expect(v).toBe(i)
		})
	})
	it("Creates an array with starting index 11", () => {
		const startIndex = 11
		const actual = createArray(5, startIndex)
		expect(actual.length).toBe(5)
		expect(actual.every((v) => v !== undefined)).toBe(true)

		actual.forEach((v, i) => {
			expect(v).toBe(i + startIndex)
		})
	})
})
