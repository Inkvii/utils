import { describe, expectTypeOf, it } from "vitest"
import { getValueByKey } from "~/object/getValueByKey"

type Test = {
	a: string
	b: number
	c: boolean
	d: string[]
	matrix: number[][]
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

	it("infers each depth of a nested array without intersecting them", () => {
		expectTypeOf(getValueByKey(object, "matrix")).toEqualTypeOf<number[][]>()
		expectTypeOf(getValueByKey(object, "matrix.0")).toEqualTypeOf<number[]>()
		expectTypeOf(getValueByKey(object, "matrix.0.1")).toEqualTypeOf<number>()
	})

	it("rejects numeric segments that are not array indices", () => {
		// @ts-expect-error "1.5" is not an array index
		getValueByKey(object, "d.1.5")
		// @ts-expect-error "1.5" is not an array index
		getValueByKey(object, "nested.arr.1.5")
		// @ts-expect-error "1.5" is not an array index
		getValueByKey(object, "nested.arr.1.5.value")
		// @ts-expect-error exponent notation is not an array index
		getValueByKey(object, "d.1e3")
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

	it("fallback name should resolve to string, not rever", () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		function arbitraryCheck(input: object, name: string): unknown {
			return getValueByKey(input, name)
		}
	})
})
