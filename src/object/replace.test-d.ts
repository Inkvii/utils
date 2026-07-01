import { describe, expectTypeOf, it } from "vitest"
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

declare const object: Test

describe("replace (types)", () => {
	it("accepts valid paths with a correctly typed value", () => {
		replace(object, "a", "newValue")
		replace(object, "b", 1234)
		replace(object, "nested.value", "newValue")
		replace(object, "nested.arr", [{ key: "Yep", value: "Yupup" }])
		replace(object, "nested.arr.0", { key: "Yep", value: "Yupup" })
		replace(object, "nested.arr.1.value", "newValue")
		replace(object, "d.0", "newValue")
	})

	it("rejects a value whose type does not match the leaf", () => {
		// @ts-expect-error boolean leaf does not accept a string
		replace(object, "nested.deep.here", "newValue")
		// @ts-expect-error element shape does not match
		replace(object, "nested.arr.0", { key: 1 })
	})

	it("rejects unknown paths", () => {
		// @ts-expect-error not a path of Test
		replace(object, "nope", "x")
	})

	it("returns the same object type", () => {
		expectTypeOf(replace(object, "a", "x")).toEqualTypeOf<Test>()
	})
})
