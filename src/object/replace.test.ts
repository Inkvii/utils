import { describe, expect, it } from "vitest"
import { replace } from "~/object/replace"

type Test = {
	a: string
	b: number
	c: boolean
	d: string[]
	nested: {
		value: string
		arr: { key: string; value: string }[]
		deep: {
			here: boolean
		}
	}
}

function createObject(): Test {
	return {
		a: "Hello",
		b: 12,
		c: false,
		d: ["first", "second"],
		nested: {
			arr: [
				{ key: "an", value: "ANO" },
				{ key: "non", value: "No" },
			],
			value: "Hey there",
			deep: {
				here: true,
			},
		},
	}
}

describe("replace", () => {
	it("replaces a top-level primitive", () => {
		expect(replace(createObject(), "a", "changed").a).toBe("changed")
	})

	it("replaces a nested value without touching siblings", () => {
		const result = replace(createObject(), "nested.value", "changed")
		expect(result.nested.value).toBe("changed")
		expect(result.nested.deep).toEqual({ here: true })
	})

	it("replaces a single array element field by index", () => {
		const result = replace(createObject(), "nested.arr.0.key", "changed")
		expect(result.nested.arr[0]).toEqual({ key: "changed", value: "ANO" })
		expect(result.nested.arr[1]).toEqual({ key: "non", value: "No" })
	})

	it("replaces a whole array element", () => {
		const result = replace(createObject(), "nested.arr.0", { key: "x", value: "y" })
		expect(result.nested.arr[0]).toEqual({ key: "x", value: "y" })
		expect(result.nested.arr[1]).toEqual({ key: "non", value: "No" })
	})

	it("replaces a primitive array element", () => {
		const result = replace(createObject(), "d.1", "SECOND")
		expect(result.d).toEqual(["first", "SECOND"])
	})

	it("does not mutate the input", () => {
		const original = createObject()
		const result = replace(original, "nested.arr.0.key", "changed")

		expect(original.nested.arr[0].key).toBe("an")
		expect(result).not.toBe(original)
		expect(result.nested).not.toBe(original.nested)
		expect(result.nested.arr).not.toBe(original.nested.arr)
	})
})
