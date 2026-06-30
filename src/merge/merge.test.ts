import { describe, expect, it } from "vitest"
import { merge } from "~/merge/merge"
import type { DeepPartial } from "~/types/DeepPartial"

type ChildObj = {
	int: number
	bool: boolean
	text: string
	children: ChildObj[]
	obj?: ChildObj
}

type MergeTest = {
	int: number
	float: number
	text: string | null
	bool: boolean
	stringArray: string[]
	intArray: number[]
	shallowObj: ChildObj
	deepObj: ChildObj[]
}

// DeepPartial utility

// type TestInput = {
// 	description: string
// 	input: DeepPartial<MergeTest>[]
// 	expected: DeepPartial<MergeTest>
// }

describe("merge", () => {
	it("Basic key composition", () => {
		const first: DeepPartial<MergeTest> = {
			int: 1,
		}
		const second: DeepPartial<MergeTest> = {
			float: 2.3,
		}
		const third: DeepPartial<MergeTest> = {
			text: "Hello",
		}
		const expected: DeepPartial<MergeTest> = {
			int: 1,
			float: 2.3,
			text: "Hello",
		}

		expect(merge([first, second, third])).toStrictEqual(expected)
	})

	it("Basic merging of incomplete objects", () => {
		const first: DeepPartial<MergeTest> = {
			int: 1,
			float: 0.0000004,
			text: "Hello",
			deepObj: [{ text: "First" }],
		}
		const second: DeepPartial<MergeTest> = {
			int: 2,
			text: "",
			intArray: [1, 2, 3],
		}
		const third: DeepPartial<MergeTest> = {
			int: 3,
			intArray: [4],
			deepObj: [{ text: "Hi there" }],
		}
		const expected: DeepPartial<MergeTest> = {
			int: 3,
			float: 0.0000004,
			text: "Hello",
			intArray: [1, 2, 3, 4],
			deepObj: [
				{
					text: "First",
				},
				{
					text: "Hi there",
				},
			],
		}

		expect(merge([first, second, third])).toStrictEqual(expected)
	})
	it("Deep merge", () => {
		const first: DeepPartial<MergeTest> = {
			int: 1,
			float: 0.0000004,
			text: "Hello",
			deepObj: [
				{
					text: "Level 1 - A",
					children: [
						{
							int: 10,
							text: "Level 2 - A.1",
							children: [
								{
									bool: true,
									text: "Level 3 - A.1.a",
									children: [],
								},
								{
									int: 11,
									children: [
										{
											text: "Level 4 - A.1.b",
											children: [],
										},
									],
								},
							],
						},
						{
							text: "Level 2 - A.2",
							children: [
								{
									text: "Level 3 - A.2.a",
									children: [],
								},
							],
						},
					],
				},
			],
		}
		const second: DeepPartial<MergeTest> = {
			int: 2,
			text: "",
			intArray: [1, 2, 3],
			deepObj: [
				{
					int: 20,
					children: [
						{
							bool: false,
							children: [
								{
									int: 201,
									text: "Level 3 - B.1.a",
									children: [],
									obj: {
										text: "Nested obj at level 3",
										children: [
											{
												text: "Level 4 - B.1.a.obj.child",
												children: [],
											},
										],
									},
								},
							],
						},
					],
				},
				{
					text: "Level 1 - B second item",
					children: [
						{
							text: "Level 2 - B second -> child",
							children: [
								{
									text: "Level 3 - B second -> grandchild",
									children: [],
								},
							],
						},
					],
				},
			],
		}
		const third: DeepPartial<MergeTest> = {
			int: 3,
			intArray: [4],
			deepObj: [
				{
					text: "Level 1 - C",
					children: [
						{
							text: "Level 2 - C.1",
							children: [
								{
									text: "Level 3 - C.1.a",
									bool: true,
									children: [
										{
											int: 301,
											text: "Level 4 - C.1.a.i",
											children: [],
										},
									],
								},
								{
									int: 302,
									children: [
										{
											text: "Level 4 - C.1.b.i",
											children: [],
										},
									],
								},
							],
						},
					],
					obj: {
						int: 999,
						text: "shallow nested obj on level 1",
						children: [
							{
								text: "obj.child level 2",
								children: [
									{
										text: "obj.child.level3",
										children: [],
									},
								],
							},
						],
					},
				},
			],
		}
		const expected: DeepPartial<MergeTest> = {
			int: 3,
			float: 0.0000004,
			text: "Hello",
			intArray: [1, 2, 3, 4],
			deepObj: [
				{
					text: "Level 1 - A",
					children: [
						{
							int: 10,
							text: "Level 2 - A.1",
							children: [
								{
									bool: true,
									text: "Level 3 - A.1.a",
									children: [],
								},
								{
									int: 11,
									children: [
										{
											text: "Level 4 - A.1.b",
											children: [],
										},
									],
								},
							],
						},
						{
							text: "Level 2 - A.2",
							children: [
								{
									text: "Level 3 - A.2.a",
									children: [],
								},
							],
						},
					],
				},

				{
					int: 20,
					children: [
						{
							bool: false,
							children: [
								{
									int: 201,
									text: "Level 3 - B.1.a",
									children: [],
									obj: {
										text: "Nested obj at level 3",
										children: [
											{
												text: "Level 4 - B.1.a.obj.child",
												children: [],
											},
										],
									},
								},
							],
						},
					],
				},

				{
					text: "Level 1 - B second item",
					children: [
						{
							text: "Level 2 - B second -> child",
							children: [
								{
									text: "Level 3 - B second -> grandchild",
									children: [],
								},
							],
						},
					],
				},

				{
					text: "Level 1 - C",
					children: [
						{
							text: "Level 2 - C.1",
							children: [
								{
									text: "Level 3 - C.1.a",
									bool: true,
									children: [
										{
											int: 301,
											text: "Level 4 - C.1.a.i",
											children: [],
										},
									],
								},
								{
									int: 302,
									children: [
										{
											text: "Level 4 - C.1.b.i",
											children: [],
										},
									],
								},
							],
						},
					],
					obj: {
						int: 999,
						text: "shallow nested obj on level 1",
						children: [
							{
								text: "obj.child level 2",
								children: [
									{
										text: "obj.child.level3",
										children: [],
									},
								],
							},
						],
					},
				},
			],
		}
		expect(merge([first, second, third])).toStrictEqual(expected)
	})
	it("Merge string | string[] key", () => {
		const left = {
			text: "first",
		}
		const right = {
			text: ["second", "third"],
		}
		expect(merge([left, right])).toStrictEqual({ text: ["second", "third"] })
		expect(merge([right, left])).toStrictEqual({ text: "first" })
		expect(merge([left, right], { enableSingleValueArrays: true })).toStrictEqual({
			text: ["first", "second", "third"],
		})
		expect(merge([right, left], { enableSingleValueArrays: true })).toStrictEqual({
			text: ["second", "third", "first"],
		})
	})
	it("Merge string | number key", () => {
		const left = {
			text: "first",
		}
		const right = {
			text: 2,
		}
		const third = {
			text: "",
		}
		expect(merge([left, right, third])).toStrictEqual({ text: 2 })
		expect(merge([third, right, left])).toStrictEqual({ text: "first" })
	})
	it("Merge tuples", () => {
		expect(
			merge(
				[
					{ text: "first", num: [] },
					{ text: [""], num: [1] },
				],
				{ enableSingleValueArrays: true }
			)
		).toStrictEqual({ text: ["first"], num: [1] })
		expect(
			merge([{ text: "first" }, { text: 1 }, { text: { anything: true } }], { enableSingleValueArrays: true })
		).toStrictEqual({ text: { anything: true } })
		expect(
			merge([{ text: "first" }, { text: 1 }, { text: [true] }, { text: [false, true] }], {
				enableSingleValueArrays: true,
			})
		).toStrictEqual({ text: ["first", 1, true, false] })
	})
})

// describe("merge", () => {
// 	const testSuite: TestInput[] = []
// 	testSuite.push({ description: "Empty input", input: [], expected: {} })
// 	testSuite.push({ description: "Single value", input: [{ bool: true }], expected: { bool: true } })
// 	testSuite.push({ description: "Override left value", input: [{ int: 1 }, { int: 2 }], expected: { int: 2 } })
// 	testSuite.push({
// 		description: "Override left with the most right one",
// 		input: [{ int: 1 }, { int: 2 }, { text: "Hello" }, { int: 4 }],
// 		expected: { int: 4, text: "Hello" },
// 	})
// 	testSuite.push({
// 		description: "Undefined values are skipped",
// 		input: [{ text: "First" }, { int: 2 }, { text: "Second" }, { text: undefined }],
// 		expected: { text: "Second", int: 2 },
// 	})
// 	testSuite.push({
// 		description: "Null values are skipped",
// 		input: [{ text: "First" }, { int: 2 }, { text: "Second" }, { text: undefined }, { text: null }],
// 		expected: { text: "Second", int: 2 },
// 	})
// 	testSuite.push({
// 		description: "Empty strings are skipped",
// 		input: [{ text: "First" }, { int: 2 }, { text: "Second" }, { text: undefined }, { text: null }, { text: "" }],
// 		expected: { text: "Second", int: 2 },
// 	})
// 	testSuite.push({
// 		description: "Zero numbers are not skipped",
// 		input: [{ int: 1 }, { int: 0 }],
// 		expected: { int: 0 },
// 	})
// 	testSuite.push({
// 		description: "NaN numbers are skipped",
// 		input: [{ int: 1 }, { int: NaN }],
// 		expected: { int: 1 },
// 	})
// 	testSuite.push({
// 		description: "Not finite numbers are skipped",
// 		input: [{ int: 1 }, { int: NaN }, { int: 2 }, { int: Number.POSITIVE_INFINITY }, { int: Number.NEGATIVE_INFINITY }],
// 		expected: { int: 2 },
// 	})
// 	testSuite.push({
// 		description: "Max int value is allowed",
// 		input: [{ int: 1 }, { int: Number.MAX_VALUE }],
// 		expected: { int: Number.MAX_VALUE },
// 	})
// 	testSuite.push({
// 		description: "Min int value is allowed",
// 		input: [{ int: 1 }, { int: Number.MIN_VALUE }],
// 		expected: { int: Number.MIN_VALUE },
// 	})
// 	testSuite.push({
// 		description: "Float override with last valid float wins",
// 		input: [{ float: 1.5 }, { float: 2.25 }],
// 		expected: { float: 2.25 },
// 	})
// 	testSuite.push({
// 		description: "Negative numbers are allowed and override",
// 		input: [{ int: 10 }, { int: -5 }],
// 		expected: { int: -5 },
// 	})
// 	testSuite.push({
// 		description: "Zero float is not skipped",
// 		input: [{ float: 3.14 }, { float: 0 }],
// 		expected: { float: 0 },
// 	})
// 	testSuite.push({
// 		description: "Same values are kept",
// 		input: [
// 			{ bool: false, int: 0, text: "", float: 0.0, shallowObj: { int: 0, children: [] } },
// 			{ bool: false, int: 0, text: "", float: 0.0, shallowObj: { int: 0, children: [] } },
// 		],
// 		expected: { bool: false, int: 0, text: "", float: 0.0, shallowObj: { int: 0, children: [] } },
// 	})
// 	testSuite.push({
// 		description: "Falsy arrays are not duplicated",
// 		input: [
// 			{ stringArray: [""], intArray: [0] },
// 			{ stringArray: [""], intArray: [0] },
// 		],
// 		expected: {
// 			stringArray: [""],
// 			intArray: [0],
// 		},
// 	})
// 	testSuite.push({
// 		description: "Array values are using set",
// 		input: [
// 			{ stringArray: ["", "a", " ", "."], intArray: [0, 1, 2, 0] },
// 			{ stringArray: ["", "a", " ", "."], intArray: [0, 1, 2, 0] },
// 		],
// 		expected: { stringArray: ["", "a", "."], intArray: [0, 1, 2] },
// 	})
//
//
// 	it.each<TestInput>(testSuite)("Merge $description", (params) => {
// 		expect(merge(params.input)).toStrictEqual(params.expected)
// 	})
// })
