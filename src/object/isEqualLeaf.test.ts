import { describe, expect, it } from "vitest"
import { isEqualLeaf } from "~/object/isEqualLeaf"

describe("isEqualLeaf", () => {
	it("compares primitives strictly", () => {
		expect(isEqualLeaf("a", "a")).toBe(true)
		expect(isEqualLeaf(1, 1)).toBe(true)
		expect(isEqualLeaf(true, true)).toBe(true)
		expect(isEqualLeaf(null, null)).toBe(true)
		expect(isEqualLeaf(undefined, undefined)).toBe(true)
		expect(isEqualLeaf("1", 1)).toBe(false)
		expect(isEqualLeaf(null, undefined)).toBe(false)
		expect(isEqualLeaf(0, false)).toBe(false)
	})

	it("treats NaN as equal to NaN", () => {
		expect(isEqualLeaf(NaN, NaN)).toBe(true)
		expect(isEqualLeaf(NaN, 0)).toBe(false)
	})

	it("treats 0 and -0 as equal", () => {
		expect(isEqualLeaf(0, -0)).toBe(true)
	})

	it("compares dates by value", () => {
		expect(isEqualLeaf(new Date(1000), new Date(1000))).toBe(true)
		expect(isEqualLeaf(new Date(1000), new Date(2000))).toBe(false)
	})

	it("treats two invalid dates as equal", () => {
		expect(isEqualLeaf(new Date("invalid"), new Date("invalid"))).toBe(true)
		expect(isEqualLeaf(new Date("invalid"), new Date(0))).toBe(false)
	})

	it("does not treat a date as equal to its timestamp or string", () => {
		expect(isEqualLeaf(new Date(1000), 1000)).toBe(false)
		expect(isEqualLeaf(new Date(1000), new Date(1000).toISOString())).toBe(false)
	})
})
