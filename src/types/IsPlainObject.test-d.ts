import { assertType, describe, expectTypeOf, it } from "vitest"
import type { DotPaths, DotPathsWithArrayIndex, FlatObject, IsPlainObject, LeafDotPaths } from "~/types"

class Point {
	x = 1
}

describe("IsPlainObject", () => {
	it("is true for object literal types", () => {
		expectTypeOf<IsPlainObject<{ a: 1 }>>().toEqualTypeOf<true>()
		expectTypeOf<IsPlainObject<Record<string, number>>>().toEqualTypeOf<true>()
	})

	it("is false for primitives, arrays and functions", () => {
		expectTypeOf<IsPlainObject<string>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<string[]>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<readonly string[]>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<[string, number]>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<() => void>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<(x: string, y: number) => void>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<typeof Point>>().toEqualTypeOf<false>()
	})

	it("is false for built-in objects", () => {
		expectTypeOf<IsPlainObject<Date>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<RegExp>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<Error>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<Map<string, number>>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<ReadonlyMap<string, number>>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<Set<string>>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<WeakMap<object, number>>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<WeakSet<object>>>().toEqualTypeOf<false>()
		expectTypeOf<IsPlainObject<Promise<string>>>().toEqualTypeOf<false>()
	})

	// Known limitation: class instances are structurally indistinguishable from object literals
	it("is true for class instances", () => {
		expectTypeOf<IsPlainObject<Point>>().toEqualTypeOf<true>()
	})
})

describe("path types stop at non-plain objects", () => {
	type Test = {
		date: Date
		map: Map<string, number>
		fn: (x: string) => void
		tags: readonly string[]
		items: readonly { id: string }[]
	}

	it("DotPaths and LeafDotPaths treat them as leaves", () => {
		expectTypeOf<DotPaths<Test>>().toEqualTypeOf<"date" | "map" | "fn" | "tags" | "items">()
		expectTypeOf<LeafDotPaths<Test>>().toEqualTypeOf<"date" | "map" | "fn" | "tags" | "items">()
		// @ts-expect-error Date methods are not paths
		assertType<DotPaths<Test>>("date.getTime")
		// @ts-expect-error array methods are not paths
		assertType<DotPaths<Test>>("tags.length")
		// @ts-expect-error functions are not walked
		assertType<DotPaths<Test>>("fn.whatever")
	})

	it("DotPathsWithArrayIndex still indexes readonly arrays", () => {
		expectTypeOf<DotPathsWithArrayIndex<Test>>().toEqualTypeOf<
			"date" | "map" | "fn" | "tags" | `tags.${bigint}` | "items" | `items.${bigint}` | `items.${bigint}.id`
		>()
	})

	it("FlatObject emits no paths below them", () => {
		expectTypeOf<keyof FlatObject<Test>>().toEqualTypeOf<
			"date" | "map" | "fn" | "tags" | `tags.${bigint}` | "items" | `items.${bigint}` | `items.${bigint}.id`
		>()
		expectTypeOf<FlatObject<Test>["date"]>().toEqualTypeOf<Date>()
	})
})
