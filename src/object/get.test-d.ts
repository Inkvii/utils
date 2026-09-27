import { describe, expectTypeOf, it } from "vitest"
import { get } from "~/object/get"

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
		expectTypeOf(get(object, "a")).toEqualTypeOf<string>()
		expectTypeOf(get(object, "b")).toEqualTypeOf<number>()
		expectTypeOf(get(object, "nested.value")).toEqualTypeOf<string>()
		expectTypeOf(get(object, "nested.deep.here")).toEqualTypeOf<boolean>()
	})

	it("infers the type of intermediate paths", () => {
		expectTypeOf(get(object, "nested.deep")).toEqualTypeOf<{ here: boolean }>()
		expectTypeOf(get(object, "nested.arr")).toEqualTypeOf<{ key: string; value: string }[]>()
		expectTypeOf(get(object, "d")).toEqualTypeOf<string[]>()
	})

	it("infers element types behind a numeric index", () => {
		expectTypeOf(get(object, "d.0")).toEqualTypeOf<string>()
		expectTypeOf(get(object, "nested.arr.0")).toEqualTypeOf<{ key: string; value: string }>()
		expectTypeOf(get(object, "nested.arr.1.value")).toEqualTypeOf<string>()
	})

	it("infers each depth of a nested array without intersecting them", () => {
		expectTypeOf(get(object, "matrix")).toEqualTypeOf<number[][]>()
		expectTypeOf(get(object, "matrix.0")).toEqualTypeOf<number[]>()
		expectTypeOf(get(object, "matrix.0.1")).toEqualTypeOf<number>()
	})

	it("infers the type of each segment below a record", () => {
		type Row = { id: number; tags: string[] }
		const records = {} as { byId: Record<string, Row>; byIndex: Record<number, Row> }

		expectTypeOf(get(records, "byId.1")).toEqualTypeOf<Row>()
		expectTypeOf(get(records, "byId.1.id")).toEqualTypeOf<number>()
		expectTypeOf(get(records, "byId.abc.tags.0")).toEqualTypeOf<string>()
		expectTypeOf(get(records, "byIndex.1")).toEqualTypeOf<Row>()
		expectTypeOf(get(records, "byIndex.1.tags")).toEqualTypeOf<string[]>()
	})

	it("infers exact types below the FlatObject depth limit", () => {
		type Folder = { name: string; children: Folder[] }
		const folder = {} as Folder

		expectTypeOf(get(folder, "children.0.children.0.children.0.name")).toEqualTypeOf<string>()
	})

	it("rejects numeric segments that are not array indices", () => {
		// @ts-expect-error "1.5" is not an array index
		get(object, "d.1.5")
		// @ts-expect-error "1.5" is not an array index
		get(object, "nested.arr.1.5")
		// @ts-expect-error "1.5" is not an array index
		get(object, "nested.arr.1.5.value")
		// @ts-expect-error exponent notation is not an array index
		get(object, "d.1e3")
	})

	it("assigns to an explicitly typed variable", () => {
		const value: boolean = get(object, "nested.deep.here")
		expectTypeOf(value).toEqualTypeOf<boolean>()
	})

	it("rejects unknown paths", () => {
		// @ts-expect-error not a path of Test
		get(object, "nope")
		// @ts-expect-error not a path of Test
		get(object, "nested.deep.nope")
	})

	it("rejects a mismatched target type", () => {
		// @ts-expect-error a string leaf is not assignable to number
		const value: number = get(object, "a")
		expectTypeOf(value).toEqualTypeOf<number>()
	})

	it("fallback name should resolve to string, not rever", () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		function arbitraryCheck(input: object, name: string): unknown {
			return get(input, name)
		}
	})
})
