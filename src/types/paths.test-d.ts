import { assertType, describe, it } from "vitest"
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
