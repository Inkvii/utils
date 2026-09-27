import { describe, expect, it } from "vitest"
import { isEmptyObject, isPlainObject } from "~/guard/utils"

class Point {
	x = 1
}

describe("isPlainObject", () => {
	it.each([{}, { a: 1 }, Object.create(null) as object])("Value [$0] IS plain object", (value) => {
		expect(isPlainObject(value)).toBe(true)
	})
	it.each([null, undefined, 1, "", [], new Date(0), new Map(), new Set(), /a/, new Point(), () => {}])(
		"Value [$0] is NOT plain object",
		(value) => {
			expect(isPlainObject(value)).toBe(false)
		}
	)
})

describe("isEmptyObject", () => {
	it("Only empty plain objects are empty", () => {
		expect(isEmptyObject({})).toBe(true)
		expect(isEmptyObject({ a: 1 })).toBe(false)
		expect(isEmptyObject(new Date(0))).toBe(false)
		expect(isEmptyObject(new Map())).toBe(false)
	})
})
