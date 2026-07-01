import type { DotPaths, DotPathsWithArrayIndex, LeafDotPaths } from "@/src"

export * from "./DeepPartial"
export * from "./DotPaths"
export * from "./DotPathsWithArrayIndex"
export * from "./FlatObject"
export * from "./IsPlainObject"
export * from "./LeafDotPaths"

type Test = {
	a: string,
	b: number,
	c: boolean,
	d: string[],
	nested: {
		value: string,
		arr: {key: string, value: string}[],
		deep: {
			here: boolean
		}
	}
}

type TestDotPaths = DotPaths<Test>
type TestDotPathsWithArrayIndex = DotPathsWithArrayIndex<Test>
type TestLeafPaths = LeafDotPaths<Test>


function test<TType>(key: TType) {}

// -------- Dot paths -----------

test<TestDotPaths>("a")
test<TestDotPaths>("b")
test<TestDotPaths>("c")
test<TestDotPaths>("d")
test<TestDotPaths>("nested")
test<TestDotPaths>("nested.value")
test<TestDotPaths>("nested.arr")
test<TestDotPaths>("nested.deep")
test<TestDotPaths>("nested.deep.here")

// ------ Doth paths with array index
test<TestDotPathsWithArrayIndex>("a")
test<TestDotPathsWithArrayIndex>("b")
test<TestDotPathsWithArrayIndex>("c")
test<TestDotPathsWithArrayIndex>("d")
test<TestDotPathsWithArrayIndex>("d.0")
test<TestDotPathsWithArrayIndex>("d.1")
test<TestDotPathsWithArrayIndex>("nested")
test<TestDotPathsWithArrayIndex>("nested.value")
test<TestDotPathsWithArrayIndex>("nested.arr")
test<TestDotPathsWithArrayIndex>("nested.arr.0")
test<TestDotPathsWithArrayIndex>("nested.arr.0.key")
test<TestDotPathsWithArrayIndex>("nested.arr.0.value")
test<TestDotPathsWithArrayIndex>("nested.arr.1.key")
test<TestDotPathsWithArrayIndex>("nested.arr.1.value")
test<TestDotPathsWithArrayIndex>("nested.deep")
test<TestDotPathsWithArrayIndex>("nested.deep.here")
//------- Leaf paths --------

test<TestLeafPaths>("a")
test<TestLeafPaths>("b")
test<TestLeafPaths>("c")
test<TestLeafPaths>("d")
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
test<TestLeafPaths>("nested") // should error
test<TestLeafPaths>("nested.value")
test<TestLeafPaths>("nested.arr")
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
test<TestLeafPaths>("nested.deep") //should error
test<TestLeafPaths>("nested.deep.here") //should error
