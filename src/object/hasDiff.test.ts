import { describe, expect, it, vi } from "vitest"
import { hasDiff } from "~/object/hasDiff"
import { isEqualLeaf } from "~/object/isEqualLeaf"

function createObject() {
	return {
		a: "Hello",
		b: 12,
		list: [{ id: 1 }, { id: 2 }],
		nested: { deep: { here: true } },
	}
}

describe("hasDiff", () => {
	it("returns false for identical objects", () => {
		expect(hasDiff(createObject(), createObject())).toBe(false)
	})

	it("returns true for a nested difference", () => {
		const input = createObject()
		input.nested.deep.here = false
		expect(hasDiff(input, createObject())).toBe(true)
	})

	it("returns true for an array difference", () => {
		const input = createObject()
		input.list.push({ id: 3 })
		expect(hasDiff(input, createObject())).toBe(true)
	})

	it("respects options.ignore", () => {
		const input = createObject()
		input.a = "Changed"
		expect(hasDiff(input, createObject(), { ignore: (path) => path === "a" })).toBe(false)
	})

	it("respects options.isEqual", () => {
		const input = createObject()
		input.a = "HELLO"
		const isEqual = (inputValue: unknown, initialValue: unknown) =>
			String(inputValue).toLowerCase() === String(initialValue).toLowerCase()
		expect(hasDiff(input, createObject(), { isEqual })).toBe(false)
	})

	it("ignores non-serializable values", () => {
		expect(hasDiff({ fn: () => 1 }, { fn: () => 2 })).toBe(false)
	})

	it("stops at the first difference", () => {
		const isEqual = vi.fn(isEqualLeaf)
		const input = createObject()
		input.a = "Changed"
		input.b = 99

		expect(hasDiff(input, createObject(), { isEqual })).toBe(true)
		expect(isEqual).toHaveBeenCalledTimes(1)
	})
})
