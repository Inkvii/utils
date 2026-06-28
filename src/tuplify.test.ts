import { describe, expect, it } from "vitest"
import { tuplify } from "~/tuplify"

describe("tuplify", () => {
	it("Wraps a single primitive into a one-element array", () => {
		expect(tuplify("a")).toStrictEqual(["a"])
		expect(tuplify(1)).toStrictEqual([1])
		expect(tuplify(false)).toStrictEqual([false])
	})
	it("Wraps empty string and falsy primitives", () => {
		expect(tuplify("")).toStrictEqual([""])
		expect(tuplify(0)).toStrictEqual([0])
	})
	it("Wraps null and undefined", () => {
		expect(tuplify(null)).toStrictEqual([null])
		expect(tuplify(undefined)).toStrictEqual([undefined])
	})
	it("Wraps a single object", () => {
		expect(tuplify({ a: 1 })).toStrictEqual([{ a: 1 }])
	})
	it("Leaves an array untouched", () => {
		expect(tuplify(["a", "b"])).toStrictEqual(["a", "b"])
		expect(tuplify([1, 2, 3])).toStrictEqual([1, 2, 3])
	})
	it("Leaves an empty array untouched", () => {
		expect(tuplify([])).toStrictEqual([])
	})
	it("Returns the same array reference", () => {
		const input = ["a", "b"]
		expect(tuplify(input)).toBe(input)
	})
})
