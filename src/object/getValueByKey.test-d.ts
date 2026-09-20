import { describe, expectTypeOf, it } from "vitest"
import { getValueByKey } from "~/object/getValueByKey"

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

describe("getObjectValue (types)", () => {
	it("infers the leaf type of the path", () => {
		expectTypeOf(getValueByKey(object, "a")).toEqualTypeOf<string>()
		expectTypeOf(getValueByKey(object, "b")).toEqualTypeOf<number>()
		expectTypeOf(getValueByKey(object, "nested.value")).toEqualTypeOf<string>()
		expectTypeOf(getValueByKey(object, "nested.deep.here")).toEqualTypeOf<boolean>()
	})

	it("infers the type of intermediate paths", () => {
		expectTypeOf(getValueByKey(object, "nested.deep")).toEqualTypeOf<{ here: boolean }>()
		expectTypeOf(getValueByKey(object, "nested.arr")).toEqualTypeOf<{ key: string; value: string }[]>()
		expectTypeOf(getValueByKey(object, "d")).toEqualTypeOf<string[]>()
	})

	it("infers element types behind a numeric index", () => {
		expectTypeOf(getValueByKey(object, "d.0")).toEqualTypeOf<string>()
		expectTypeOf(getValueByKey(object, "nested.arr.0")).toEqualTypeOf<{ key: string; value: string }>()
		expectTypeOf(getValueByKey(object, "nested.arr.1.value")).toEqualTypeOf<string>()
	})

	it("assigns to an explicitly typed variable", () => {
		const value: boolean = getValueByKey(object, "nested.deep.here")
		expectTypeOf(value).toEqualTypeOf<boolean>()
	})

	it("rejects unknown paths", () => {
		// @ts-expect-error not a path of Test
		getValueByKey(object, "nope")
		// @ts-expect-error not a path of Test
		getValueByKey(object, "nested.deep.nope")
	})

	it("rejects a mismatched target type", () => {
		// @ts-expect-error a string leaf is not assignable to number
		const value: number = getValueByKey(object, "a")
		expectTypeOf(value).toEqualTypeOf<number>()
	})
})
