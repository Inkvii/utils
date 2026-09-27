import { describe, expect, it } from "vitest"
import { diffByIndex } from "~/array/diffByIndex"

describe("diffByIndex", () => {
	it("pairs items with the same index", () => {
		expect(diffByIndex(["a", "b"], ["x", "y"])).toStrictEqual([
			{ index: 0, inputValue: "a", initialValue: "x" },
			{ index: 1, inputValue: "b", initialValue: "y" },
		])
	})

	it("pads the initial side with undefined when the input is longer", () => {
		expect(diffByIndex(["a", "b"], ["a"])).toStrictEqual([
			{ index: 0, inputValue: "a", initialValue: "a" },
			{ index: 1, inputValue: "b", initialValue: undefined },
		])
	})

	it("pads the input side with undefined when the initial is longer", () => {
		expect(diffByIndex(["a"], ["a", "b"])).toStrictEqual([
			{ index: 0, inputValue: "a", initialValue: "a" },
			{ index: 1, inputValue: undefined, initialValue: "b" },
		])
	})

	it("returns no pairs for empty arrays", () => {
		expect(diffByIndex([], [])).toStrictEqual([])
	})

	it("keeps item references", () => {
		const row = { id: 1 }
		expect(diffByIndex([row], [])[0].inputValue).toBe(row)
	})
})
