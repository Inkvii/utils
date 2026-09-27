import { describe, expectTypeOf, it } from "vitest"
import { diff, isDiffEntry, type DiffEntry, type DiffFlat, type DiffNested, type DiffOptions } from "~/object/diff"
import { hasDiff } from "~/object/hasDiff"

type Test = {
	a: string
	b: number
	date: Date
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

describe("diff (types)", () => {
	it("returns a nested result by default", () => {
		expectTypeOf(diff(object, object)).toEqualTypeOf<DiffNested<Test>>()
		expectTypeOf(diff(object, object, { output: "nested" })).toEqualTypeOf<DiffNested<Test>>()
	})

	it("returns a flat result for output: flat", () => {
		expectTypeOf(diff(object, object, { output: "flat" })).toEqualTypeOf<DiffFlat<Test>>()
	})

	it("returns a union when output is not known statically", () => {
		const options: DiffOptions = {}
		expectTypeOf(diff(object, object, options)).toEqualTypeOf<DiffNested<Test> | DiffFlat<Test>>()
	})

	it("accepts a partial initial object", () => {
		diff(object, {})
		diff(object, { nested: { deep: {} } })
		diff(object, { nested: { arr: [{ key: "x" }] } })
		// @ts-expect-error wrong value type
		diff(object, { a: 1 })
	})

	it("types flat keys by path", () => {
		const result = diff(object, object, { output: "flat" })
		expectTypeOf(result.a).toEqualTypeOf<DiffEntry<string> | undefined>()
		expectTypeOf(result["nested.deep.here"]).toEqualTypeOf<DiffEntry<boolean> | undefined>()
		expectTypeOf(result["nested.arr.0.value"]).toEqualTypeOf<DiffEntry<string> | undefined>()
		// @ts-expect-error not a path of Test
		void result["nope"]
	})

	it("types flat keys of recursive types up to the depth limit", () => {
		type Folder = { name: string; children: Folder[] }
		const folder: Folder = { name: "root", children: [] }

		const result = diff({ root: folder }, { root: folder }, { output: "flat" })
		expectTypeOf(result["root.children.0.name"]).toEqualTypeOf<DiffEntry<string> | undefined>()
		expectTypeOf(result["root.children.0.children"]).toEqualTypeOf<DiffEntry<Folder[]> | undefined>()
		expectTypeOf(result["root.children.0.children.1.children.nope"]).toEqualTypeOf<DiffEntry<unknown> | undefined>()
		// @ts-expect-error not a path of Folder
		void result["root.nope"]

		expectTypeOf<DiffFlat<{ root: Folder }, 5>["root.children.0.children.1.name"]>().toEqualTypeOf<
			DiffEntry<string> | undefined
		>()
	})

	it("types nested nodes as entries or deeper results", () => {
		const result = diff(object, object)
		expectTypeOf(result.a).toEqualTypeOf<DiffEntry<string> | undefined>()
		expectTypeOf(result.date).toEqualTypeOf<DiffEntry<Date> | undefined>()
		expectTypeOf(result.nested).toEqualTypeOf<DiffEntry<Test["nested"]> | DiffNested<Test["nested"]> | undefined>()
		expectTypeOf(result.d).toEqualTypeOf<DiffEntry<string[]> | Array<DiffEntry<string>> | undefined>()
	})

	it("narrows nested nodes with isDiffEntry", () => {
		const node = diff(object, object).nested
		if (isDiffEntry(node)) {
			expectTypeOf(node).toEqualTypeOf<DiffEntry<Test["nested"]>>()
		} else if (node) {
			expectTypeOf(node).toEqualTypeOf<DiffNested<Test["nested"]>>()
			expectTypeOf(node.value).toEqualTypeOf<DiffEntry<string> | undefined>()
		}
	})
})

describe("hasDiff (types)", () => {
	it("returns boolean and accepts a partial initial object", () => {
		expectTypeOf(hasDiff(object, { nested: {} })).toEqualTypeOf<boolean>()
	})

	it("does not accept the output option", () => {
		// @ts-expect-error output is not an option of hasDiff
		hasDiff(object, object, { output: "flat" })
	})
})
