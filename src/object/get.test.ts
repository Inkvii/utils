import { describe, expect, it } from "vitest"
import { get } from "~/object/get"

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

describe("getObjectValue", () => {
	it("reads a top-level primitive", () => {
		expect(get(createObject(), "a")).toBe("Hello")
		expect(get(createObject(), "b")).toBe(12)
		expect(get(createObject(), "c")).toBe(false)
	})

	it("reads a nested value", () => {
		expect(get(createObject(), "nested.value")).toBe("Hey there")
		expect(get(createObject(), "nested.deep.here")).toBe(true)
	})

	it("reads a single array element field by index", () => {
		expect(get(createObject(), "nested.arr.0.key")).toBe("an")
		expect(get(createObject(), "nested.arr.1.value")).toBe("No")
	})

	it("reads a whole array element", () => {
		expect(get(createObject(), "nested.arr.0")).toEqual({ key: "an", value: "ANO" })
	})

	it("reads a primitive array element", () => {
		expect(get(createObject(), "d.1")).toBe("second")
	})

	it("reads a whole nested object", () => {
		expect(get(createObject(), "nested.deep")).toEqual({ here: true })
		expect(get(createObject(), "d")).toEqual(["first", "second"])
	})

	it("returns the same reference as the source", () => {
		const original = createObject()
		expect(get(original, "nested.arr")).toBe(original.nested.arr)
		expect(get(original, "nested.arr.0")).toBe(original.nested.arr[0])
	})

	it("returns undefined for a missing array index instead of throwing", () => {
		expect(get(createObject(), "nested.arr.99.key")).toBeUndefined()
	})

	it("does not mutate the input", () => {
		const original = createObject()
		get(original, "nested.arr.0.key")

		expect(original).toEqual(createObject())
	})
})
