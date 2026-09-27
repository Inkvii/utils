import { assertType, describe, expectTypeOf, it } from "vitest"
import type { DotPaths, DotPathsWithArrayIndex, LeafDotPaths } from "~/types"

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

describe("DotPaths", () => {
	it("includes every key and intermediate/leaf object path (no array indices)", () => {
		assertType<DotPaths<Test>>("a")
		assertType<DotPaths<Test>>("b")
		assertType<DotPaths<Test>>("c")
		assertType<DotPaths<Test>>("d")
		assertType<DotPaths<Test>>("nested")
		assertType<DotPaths<Test>>("nested.value")
		assertType<DotPaths<Test>>("nested.arr")
		assertType<DotPaths<Test>>("nested.deep")
		assertType<DotPaths<Test>>("nested.deep.here")
	})

	it("rejects array-index paths", () => {
		// @ts-expect-error DotPaths does not descend into arrays
		assertType<DotPaths<Test>>("d.0")
		// @ts-expect-error DotPaths does not descend into arrays
		assertType<DotPaths<Test>>("nested.arr.0")
	})
})

describe("DotPathsWithArrayIndex", () => {
	it("includes numeric indices for arrays", () => {
		assertType<DotPathsWithArrayIndex<Test>>("a")
		assertType<DotPathsWithArrayIndex<Test>>("b")
		assertType<DotPathsWithArrayIndex<Test>>("c")
		assertType<DotPathsWithArrayIndex<Test>>("d")
		assertType<DotPathsWithArrayIndex<Test>>("d.0")
		assertType<DotPathsWithArrayIndex<Test>>("d.1")
		assertType<DotPathsWithArrayIndex<Test>>("nested")
		assertType<DotPathsWithArrayIndex<Test>>("nested.value")
		assertType<DotPathsWithArrayIndex<Test>>("nested.arr")
		assertType<DotPathsWithArrayIndex<Test>>("nested.arr.0")
		assertType<DotPathsWithArrayIndex<Test>>("nested.arr.0.key")
		assertType<DotPathsWithArrayIndex<Test>>("nested.arr.0.value")
		assertType<DotPathsWithArrayIndex<Test>>("nested.arr.1.key")
		assertType<DotPathsWithArrayIndex<Test>>("nested.arr.1.value")
		assertType<DotPathsWithArrayIndex<Test>>("nested.deep")
		assertType<DotPathsWithArrayIndex<Test>>("nested.deep.here")
	})

	it("includes every index segment of nested arrays", () => {
		assertType<DotPathsWithArrayIndex<{ matrix: number[][] }>>("matrix.0")
		assertType<DotPathsWithArrayIndex<{ matrix: number[][] }>>("matrix.0.1")
	})

	// Known limitation: negative ("-1") and hex ("0x1") segments still match
	// `${bigint}` and are accepted.
	it("rejects numeric segments that are not integer indices", () => {
		// @ts-expect-error "1.5" is not an array index
		assertType<DotPathsWithArrayIndex<Test>>("d.1.5")
		// @ts-expect-error "1.5" is not an array index
		assertType<DotPathsWithArrayIndex<Test>>("nested.arr.1.5.key")
		// @ts-expect-error exponent notation is not an array index
		assertType<DotPathsWithArrayIndex<Test>>("d.1e3")
		// @ts-expect-error leading zeros are not array indices
		assertType<DotPathsWithArrayIndex<Test>>("d.01")
	})
})

describe("LeafDotPaths", () => {
	it("includes only leaf paths", () => {
		assertType<LeafDotPaths<Test>>("a")
		assertType<LeafDotPaths<Test>>("b")
		assertType<LeafDotPaths<Test>>("c")
		assertType<LeafDotPaths<Test>>("d")
		assertType<LeafDotPaths<Test>>("nested.value")
		assertType<LeafDotPaths<Test>>("nested.arr")
		assertType<LeafDotPaths<Test>>("nested.deep.here")
	})

	it("rejects intermediate object paths", () => {
		// @ts-expect-error "nested" is not a leaf
		assertType<LeafDotPaths<Test>>("nested")
		// @ts-expect-error "nested.deep" is not a leaf
		assertType<LeafDotPaths<Test>>("nested.deep")
	})
})

// Types without statically known keys cannot be walked, so every path type falls
// back to accepting any string below them — never an empty (`never`) path set.
describe("opaque types", () => {
	type WithMeta = { a: string; meta: object }

	it("fall back to string at the top level", () => {
		expectTypeOf<DotPaths<object>>().toEqualTypeOf<string>()
		expectTypeOf<DotPaths<unknown>>().toEqualTypeOf<string>()
		expectTypeOf<DotPathsWithArrayIndex<object>>().toEqualTypeOf<string>()
		expectTypeOf<DotPathsWithArrayIndex<unknown>>().toEqualTypeOf<string>()
		expectTypeOf<LeafDotPaths<object>>().toEqualTypeOf<string>()
		expectTypeOf<LeafDotPaths<unknown>>().toEqualTypeOf<string>()
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		expectTypeOf<DotPaths<{}>>().toEqualTypeOf<string>()
	})

	it("fall back to string below an opaque nested field", () => {
		expectTypeOf<DotPaths<WithMeta>>().toEqualTypeOf<"a" | "meta" | `meta.${string}`>()
		expectTypeOf<DotPathsWithArrayIndex<WithMeta>>().toEqualTypeOf<"a" | "meta" | `meta.${string}`>()
		expectTypeOf<LeafDotPaths<WithMeta>>().toEqualTypeOf<"a" | `meta.${string}`>()
	})

	it("still reject unknown keys at known levels", () => {
		// @ts-expect-error "nope" is not a key of WithMeta
		assertType<DotPaths<WithMeta>>("nope")
		// @ts-expect-error "nope" is not a key of WithMeta
		assertType<DotPathsWithArrayIndex<WithMeta>>("nope")
		// @ts-expect-error "nope" is not a key of WithMeta
		assertType<LeafDotPaths<WithMeta>>("nope")
	})

	it("keep arrays of opaque elements index-only", () => {
		expectTypeOf<DotPathsWithArrayIndex<{ list: object[] }>>().toEqualTypeOf<
			"list" | `list.${bigint}` | `list.${bigint}.${string}`
		>()
		// @ts-expect-error "x" is not an array index
		assertType<DotPathsWithArrayIndex<{ list: object[] }>>("list.x")
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		type AnyList = DotPathsWithArrayIndex<{ list: any[] }>
		assertType<AnyList>("list.0.x")
		// @ts-expect-error "x" is not an array index
		assertType<AnyList>("list.x")
	})
})

// Only `TDepth` (default 5) nested objects/arrays below the root are expanded.
// Deeper paths are accepted as `${path}.${string}`, which keeps recursive types
// from collapsing to `any`.
describe("depth limit", () => {
	type Folder = { name: string; children: Folder[] }
	interface Chain {
		value: number
		child: Chain
	}
	const fiveChildren = "child.child.child.child.child"

	it("does not collapse recursive types to any", () => {
		expectTypeOf<DotPaths<Chain>>().not.toBeAny()
		expectTypeOf<LeafDotPaths<Chain>>().not.toBeAny()
		expectTypeOf<DotPathsWithArrayIndex<Chain>>().not.toBeAny()
		expectTypeOf<DotPathsWithArrayIndex<Folder>>().not.toBeAny()
	})

	it("checks paths exactly up to the default depth of 5", () => {
		assertType<DotPaths<Chain>>(`${fiveChildren}.value`)
		assertType<LeafDotPaths<Chain>>(`${fiveChildren}.value`)
		assertType<DotPathsWithArrayIndex<Chain>>(`${fiveChildren}.value`)
		assertType<DotPathsWithArrayIndex<Folder>>("children.0.children.1.children.2")
		// @ts-expect-error known levels still reject unknown keys
		assertType<DotPaths<Chain>>(`${fiveChildren}.nope`)
		// @ts-expect-error known levels still reject unknown keys
		assertType<LeafDotPaths<Chain>>(`${fiveChildren}.nope`)
		// @ts-expect-error known levels still reject unknown keys
		assertType<DotPathsWithArrayIndex<Chain>>(`${fiveChildren}.nope`)
		// @ts-expect-error known levels still reject unknown keys
		assertType<DotPathsWithArrayIndex<Folder>>("children.0.children.1.nope")
	})

	it("accepts any path below the depth limit", () => {
		assertType<DotPaths<Chain>>(`${fiveChildren}.child.anything`)
		assertType<LeafDotPaths<Chain>>(`${fiveChildren}.child.anything`)
		assertType<DotPathsWithArrayIndex<Chain>>(`${fiveChildren}.child.anything`)
		assertType<DotPathsWithArrayIndex<Folder>>("children.0.children.1.children.2.anything")
	})

	it("accepts a custom depth", () => {
		expectTypeOf<DotPaths<Chain, 1>>().toEqualTypeOf<
			"value" | "child" | "child.value" | "child.child" | `child.child.${string}`
		>()
		expectTypeOf<LeafDotPaths<Chain, 1>>().toEqualTypeOf<"value" | "child.value" | `child.child.${string}`>()
		expectTypeOf<DotPathsWithArrayIndex<Folder, 1>>().toEqualTypeOf<
			"name" | "children" | `children.${bigint}` | `children.${bigint}.${string}`
		>()
		expectTypeOf<DotPaths<Test, 0>>().toEqualTypeOf<"a" | "b" | "c" | "d" | "nested" | `nested.${string}`>()
		// @ts-expect-error root keys are always checked
		assertType<DotPaths<Test, 0>>("nope")
	})

	it("accepts a depth above 10", () => {
		const twelveChildren = `${fiveChildren}.${fiveChildren}.child.child`
		assertType<DotPaths<Chain, 12>>(`${twelveChildren}.value`)
		// @ts-expect-error known levels still reject unknown keys
		assertType<DotPaths<Chain, 12>>(`${twelveChildren}.nope`)
	})
})
