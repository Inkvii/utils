import { describe, expectTypeOf, it } from "vitest"
import type { PathValue } from "~/types"

type Row = { id: number; tags: string[] }

type Test = {
	a: string
	optional?: number
	nullable: string | null
	d: string[]
	matrix: number[][]
	readonlyItems: readonly { flag: boolean }[]
	nested: {
		deep: { here: boolean }
	}
	byId: Record<string, Row>
	byIndex: Record<number, Row>
	literalKeys: { 1: string; 2: { value: boolean } }
	meta: object
}

describe("PathValue", () => {
	it("resolves object paths", () => {
		expectTypeOf<PathValue<Test, "a">>().toEqualTypeOf<string>()
		expectTypeOf<PathValue<Test, "nullable">>().toEqualTypeOf<string | null>()
		expectTypeOf<PathValue<Test, "nested">>().toEqualTypeOf<{ deep: { here: boolean } }>()
		expectTypeOf<PathValue<Test, "nested.deep">>().toEqualTypeOf<{ here: boolean }>()
		expectTypeOf<PathValue<Test, "nested.deep.here">>().toEqualTypeOf<boolean>()
	})

	it("strips undefined from optional keys", () => {
		expectTypeOf<PathValue<Test, "optional">>().toEqualTypeOf<number>()
		expectTypeOf<PathValue<{ settings?: { theme: string } }, "settings.theme">>().toEqualTypeOf<string>()
	})

	it("resolves array elements by integer segments", () => {
		expectTypeOf<PathValue<Test, "d">>().toEqualTypeOf<string[]>()
		expectTypeOf<PathValue<Test, "d.0">>().toEqualTypeOf<string>()
		expectTypeOf<PathValue<Test, "matrix.0">>().toEqualTypeOf<number[]>()
		expectTypeOf<PathValue<Test, "matrix.10.25">>().toEqualTypeOf<number>()
		expectTypeOf<PathValue<Test, "readonlyItems.0.flag">>().toEqualTypeOf<boolean>()
		expectTypeOf<PathValue<Row[], "1.tags.0">>().toEqualTypeOf<string>()
	})

	it("resolves each segment below a string record", () => {
		expectTypeOf<PathValue<Test, "byId">>().toEqualTypeOf<Record<string, Row>>()
		expectTypeOf<PathValue<Test, "byId.1">>().toEqualTypeOf<Row>()
		expectTypeOf<PathValue<Test, "byId.abc.id">>().toEqualTypeOf<number>()
		expectTypeOf<PathValue<Test, "byId.1.tags">>().toEqualTypeOf<string[]>()
		expectTypeOf<PathValue<Test, "byId.1.tags.0">>().toEqualTypeOf<string>()
	})

	it("resolves numeric segments of numeric keys", () => {
		expectTypeOf<PathValue<Test, "byIndex.1">>().toEqualTypeOf<Row>()
		expectTypeOf<PathValue<Test, "byIndex.1.id">>().toEqualTypeOf<number>()
		expectTypeOf<PathValue<Test, "literalKeys.1">>().toEqualTypeOf<string>()
		expectTypeOf<PathValue<Test, "literalKeys.2.value">>().toEqualTypeOf<boolean>()
		expectTypeOf<PathValue<Test, "literalKeys.3">>().toEqualTypeOf<unknown>()
	})

	it("resolves paths of recursive types at any depth", () => {
		type Folder = { name: string; children: Folder[] }

		expectTypeOf<PathValue<Folder, "children.0.children.0.children.0.children.0.children.0">>().toEqualTypeOf<Folder>()
		expectTypeOf<
			PathValue<Folder, "children.0.children.0.children.0.children.0.children.0.name">
		>().toEqualTypeOf<string>()
	})

	it("resolves a union of paths to a union of values", () => {
		expectTypeOf<PathValue<Test, "a" | "nested.deep.here">>().toEqualTypeOf<string | boolean>()
	})

	it("resolves unknown segments to unknown", () => {
		expectTypeOf<PathValue<Test, "nope">>().toEqualTypeOf<unknown>()
		expectTypeOf<PathValue<Test, "nested.nope">>().toEqualTypeOf<unknown>()
		expectTypeOf<PathValue<Test, "nested.deep.here.nope">>().toEqualTypeOf<unknown>()
		expectTypeOf<PathValue<Test, "d.x">>().toEqualTypeOf<unknown>()
		expectTypeOf<PathValue<Test, "d.1.5">>().toEqualTypeOf<unknown>()
	})

	it("resolves opaque types and a non-literal path to unknown", () => {
		expectTypeOf<PathValue<Test, "meta">>().toEqualTypeOf<object>()
		expectTypeOf<PathValue<Test, "meta.x">>().toEqualTypeOf<unknown>()
		expectTypeOf<PathValue<object, "a.b">>().toEqualTypeOf<unknown>()
		expectTypeOf<PathValue<unknown, "a">>().toEqualTypeOf<unknown>()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expectTypeOf<PathValue<any, "a">>().toEqualTypeOf<unknown>()
		expectTypeOf<PathValue<Test, string>>().toEqualTypeOf<unknown>()
	})
})
