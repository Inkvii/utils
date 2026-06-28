import { mergeArrays } from "~/merge/mergeArrays"
import { describe, expect, it } from "vitest"

describe("mergeArrays", () => {
	it("Empty arrays", () => {
		type Data = object
		const left: Data[] = []
		const right: Data[] = []
		const expected: Data[] = []
		expect(mergeArrays([left, right])).toStrictEqual(expected)
	})
	it("Normal string arrays", () => {
		type Data = string
		const left: Data[] = ["first"]
		const right: Data[] = ["second"]
		const expected: Data[] = ["first", "second"]
		expect(mergeArrays([left, right])).toStrictEqual(expected)
	})
	it("Multiple string arrays", () => {
		type Data = string
		const expected: Data[] = ["first", "second", "third", "fourth", "fifth"]
		expect(mergeArrays([["first"], ["second"], ["third"], ["fourth", "fifth"]])).toStrictEqual(expected)
	})
	it("String arrays with empty values", () => {
		type Data = string
		const left: Data[] = ["first"]
		const right: Data[] = [""]
		const expected: Data[] = ["first"]
		expect(mergeArrays([left, right])).toStrictEqual(expected)
		expect(mergeArrays([right, left])).toStrictEqual(expected)
	})
	it("String arrays with empty values and disabled filter", () => {
		type Data = string
		const left: Data[] = ["first"]
		const right: Data[] = [""]
		expect(mergeArrays([left, right], { disableDistinctPrimitiveFilter: true })).toStrictEqual(["first", ""])
		expect(mergeArrays([right, left], { disableDistinctPrimitiveFilter: true })).toStrictEqual(["", "first"])
	})
	it("Unallowed non-empty arrays", () => {
		type Data = string | number | boolean | null | undefined
		const left: Data[] = ["", NaN, "", null, null, undefined, undefined, NaN, NaN, 0, " ", false, false]
		const right: Data[] = ["", NaN, "", null, null, undefined, undefined, NaN, NaN, 0, " ", false, false]
		const expected: Data[] = [0, " ", false]
		expect(mergeArrays([left, right])).toStrictEqual(expected)
		expect(mergeArrays([right, left])).toStrictEqual(expected)
		expect(mergeArrays([left, left, left, left, right, right, right])).toStrictEqual(expected)
	})

	it("String arrays skips unallowed values", () => {
		type Data = string | undefined | null
		const left: Data[] = ["first", "   untrimmed   "]
		const right: Data[] = ["", "second", null, "third", undefined, undefined, null, null]
		const expectedLeft: Data[] = ["first", "   untrimmed   ", "second", "third"]
		const expectedRight: Data[] = ["second", "third", "first", "   untrimmed   "]
		expect(mergeArrays([left, right])).toStrictEqual(expectedLeft)
		expect(mergeArrays([right, left])).toStrictEqual(expectedRight)
	})
	it("Boolean arrays", () => {
		type Data = boolean | null | undefined
		const left: Data[] = [true, false, null, true, undefined, false]
		const right: Data[] = [null, false, undefined, true]
		expect(mergeArrays([left, right])).toStrictEqual([true, false])
		expect(mergeArrays([right, left])).toStrictEqual([false, true])
		expect(mergeArrays([left, right], { disableDistinctPrimitiveFilter: true })).toStrictEqual([
			true,
			false,
			null,
			true,
			undefined,
			false,
			null,
			false,
			undefined,
			true,
		])
	})
	it("Arrays with object are merged together", () => {
		type Data = string | object
		const left: Data[] = ["first", { a: "yes" }]
		const right: Data[] = ["second"]
		expect(mergeArrays([left, right])).toStrictEqual(["first", { a: "yes" }, "second"])
		expect(mergeArrays([left, right], { disableDistinctPrimitiveFilter: true })).toStrictEqual([
			"first",
			{ a: "yes" },
			"second",
		])
	})
	it("Arrays with array are merged together", () => {
		type Data = string | string[]
		const left: Data[] = ["first", ["yes"], "first"]
		const right: Data[] = ["second", "first"]
		expect(mergeArrays([left, right])).toStrictEqual(["first", ["yes"], "first", "second", "first"])
		expect(mergeArrays([left, right], { disableDistinctPrimitiveFilter: true })).toStrictEqual([
			"first",
			["yes"],
			"first",
			"second",
			"first",
		])
	})
})
