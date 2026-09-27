import { describe, expect, it, vi } from "vitest"
import { diffByIndex, type ArrayDiffHandler } from "~/array/diffByIndex"
import { diff, isDiffEntry } from "~/object/diff"
import { isEqualLeaf } from "~/object/isEqualLeaf"

type Row = { id: number; value: string }

type Test = {
	a: string
	b: number
	c: boolean
	d: string[]
	date?: Date
	nested: {
		value: string
		arr: Row[]
		deep: {
			here: boolean
		}
	}
}

function createObject(): Test {
	return {
		a: "Hello",
		b: 12,
		c: false,
		d: ["first", "second"],
		nested: {
			value: "Hey there",
			arr: [
				{ id: 1, value: "one" },
				{ id: 2, value: "two" },
			],
			deep: {
				here: true,
			},
		},
	}
}

// Loosely typed wrapper for runtime edge cases that the static types intentionally reject
const looseDiff = diff as (input: unknown, initial: unknown, options?: object) => Record<string, unknown>

/** Folder with an empty `children` array is a file */
type Folder = { name: string; children: Folder[] }

/** Contains only values that diff compares */
type SerializableTest = {
	text: string
	count: number
	flag: boolean
	nullable: string | null
	maybe: string | undefined
	optional?: number
	tags: string[]
	scores: number[]
	createdAt: Date
	deletedAt: Date | null
	history: Date[]
	settings?: { theme: string; fontSize: number }
	profile: { firstName: string; lastName: string }
	extras: Record<string, unknown>
	order: { ids: number[]; lines: Row[] }
	company: { name: string; address: { city: string; geo: { lat: number; lng: number } } }
	root: Folder
	matrix: number[][]
	board: Row[][]
}

class Coordinates {
	constructor(
		public x: number,
		public y: number
	) {}
}

type InteractiveFolder = {
	name: string
	children: InteractiveFolder[]
	onOpen: () => void
	/** Circular reference back to the containing folder */
	parent?: InteractiveFolder
}

/** Everything from {@link SerializableTest} plus values that diff skips, at every level */
type UnserializableTest = Omit<SerializableTest, "profile" | "order" | "root" | "board"> & {
	format: (value: string) => string
	id: symbol
	big: bigint
	lookup: Map<string, number>
	unique: Set<string>
	pattern: RegExp
	position: Coordinates
	title: string | (() => string)
	onClose?: () => void
	callbacks: Array<() => void>
	mixed: Array<string | (() => string) | Map<string, number>>
	profile: SerializableTest["profile"] & { getFullName: () => string; labels: Set<string> }
	order: { ids: number[]; lines: Array<Row & { onSelect: () => void }>; total: bigint }
	root: InteractiveFolder
	board: Array<Array<Row & { meta: Map<string, string> }>>
}

function day(dayOfMonth: number): Date {
	return new Date(Date.UTC(2026, 0, dayOfMonth))
}

function createSerializable(): SerializableTest {
	return {
		text: "Hello",
		count: 0,
		flag: false,
		nullable: null,
		maybe: undefined,
		tags: ["a", "b"],
		scores: [10, 20, 30],
		createdAt: day(1),
		deletedAt: null,
		history: [day(2), day(3)],
		profile: { firstName: "Jane", lastName: "Doe" },
		extras: {},
		order: {
			ids: [1, 2],
			lines: [
				{ id: 1, value: "one" },
				{ id: 2, value: "two" },
			],
		},
		company: { name: "Acme", address: { city: "Prague", geo: { lat: 50.08, lng: 14.43 } } },
		// root
		// ├── src
		// │   ├── index.ts
		// │   └── utils
		// │       └── diff.ts
		// └── README.md
		root: {
			name: "root",
			children: [
				{
					name: "src",
					children: [
						{ name: "index.ts", children: [] },
						{ name: "utils", children: [{ name: "diff.ts", children: [] }] },
					],
				},
				{ name: "README.md", children: [] },
			],
		},
		matrix: [
			[1, 2],
			[3, 4],
		],
		board: [
			[
				{ id: 1, value: "a1" },
				{ id: 2, value: "a2" },
			],
			[{ id: 3, value: "b1" }],
		],
	}
}

/** Every call creates new functions, symbols, maps, … so two results never share an unserializable value */
function createUnserializable(): UnserializableTest {
	const base = createSerializable()
	return {
		...base,
		format: (value) => value.trim(),
		id: Symbol("id"),
		big: BigInt(1),
		lookup: new Map([["a", 1]]),
		unique: new Set(["a"]),
		pattern: /hello/i,
		position: new Coordinates(1, 2),
		title: () => "Hello",
		callbacks: [() => undefined, () => undefined],
		mixed: ["a", () => "b", new Map([["c", 1]])],
		profile: { ...base.profile, getFullName: () => "Jane Doe", labels: new Set(["admin"]) },
		order: {
			ids: base.order.ids,
			lines: base.order.lines.map((line) => ({ ...line, onSelect: () => undefined })),
			total: BigInt(3),
		},
		root: toInteractiveFolder(base.root),
		board: base.board.map((row) => row.map((cell) => ({ ...cell, meta: new Map([["color", "red"]]) }))),
	}
}

function toInteractiveFolder(folder: Folder, parent?: InteractiveFolder): InteractiveFolder {
	const result: InteractiveFolder = { name: folder.name, children: [], onOpen: () => undefined, parent }
	result.children = folder.children.map((child) => toInteractiveFolder(child, result))
	return result
}

/** Folder nested `depth` levels deep, each level having a single child */
function createFolderChain(depth: number, leafName: string): Folder {
	let folder: Folder = { name: leafName, children: [] }
	for (let level = depth - 1; level >= 0; level--) {
		folder = { name: `level-${level}`, children: [folder] }
	}
	return folder
}

function entry(path: string, inputValue: unknown, initialValue: unknown) {
	return { path, inputValue, initialValue }
}

/** Expected `output: "flat"` result built from entries */
function flatOf(...entries: ReturnType<typeof entry>[]): Record<string, ReturnType<typeof entry>> {
	return Object.fromEntries(entries.map((item) => [item.path, item]))
}

/** Sparse array with values only at the given indices, same as arrays in nested output */
function sparse(items: Record<number, unknown>): unknown[] {
	const result: unknown[] = []
	for (const [index, value] of Object.entries(items)) result[Number(index)] = value
	return result
}

describe("diff", () => {
	describe("output", () => {
		it("returns an empty object for identical objects", () => {
			expect(diff(createObject(), createObject())).toStrictEqual({})
			expect(diff(createObject(), createObject(), { output: "flat" })).toStrictEqual({})
		})

		it("returns a nested result by default", () => {
			const input = createObject()
			input.nested.deep.here = false

			expect(diff(input, createObject())).toStrictEqual({
				nested: { deep: { here: { path: "nested.deep.here", inputValue: false, initialValue: true } } },
			})
		})

		it("returns a flat result keyed by dot-notation path", () => {
			const input = createObject()
			input.a = "Changed"
			input.nested.deep.here = false

			expect(diff(input, createObject(), { output: "flat" })).toStrictEqual({
				a: { path: "a", inputValue: "Changed", initialValue: "Hello" },
				"nested.deep.here": { path: "nested.deep.here", inputValue: false, initialValue: true },
			})
		})

		it("keeps the path in nested entries equal to the flat key", () => {
			const input = createObject()
			input.nested.arr[1].value = "TWO"

			const nested = diff(input, createObject())
			const flat = diff(input, createObject(), { output: "flat" })

			const nestedNode = nested.nested
			if (nestedNode === undefined || isDiffEntry(nestedNode)) throw new Error("expected a nested node")
			const arr = nestedNode.arr
			if (arr === undefined || isDiffEntry(arr)) throw new Error("expected a nested array")

			expect(arr[1]).toStrictEqual({
				value: { path: "nested.arr.1.value", inputValue: "TWO", initialValue: "two" },
			})
			expect(Object.keys(flat)).toStrictEqual(["nested.arr.1.value"])
		})

		it("distinguishes entries from nested nodes with isDiffEntry", () => {
			const input = { user: { path: "a", name: "x" } as { path: string; name: string } | null }
			const nested = diff(input, { user: { path: "b", name: "x" } })
			const whole = diff(input, { user: null })

			expect(isDiffEntry(nested.user)).toBe(false)
			expect(isDiffEntry(whole.user)).toBe(true)
			expect(isDiffEntry(undefined)).toBe(false)
			expect(isDiffEntry([])).toBe(false)
		})

		it("uses an array as the nested root when the input is an array", () => {
			const result = looseDiff([1, 2], [1, 3])
			expect(Array.isArray(result)).toBe(true)
			expect(result[1]).toStrictEqual({ path: "1", inputValue: 2, initialValue: 3 })
		})
	})

	describe("objects", () => {
		it("reports a key added in the input", () => {
			const input = { a: 1, added: "yes" }
			expect(diff(input, { a: 1 }, { output: "flat" })).toStrictEqual({
				added: { path: "added", inputValue: "yes", initialValue: undefined },
			})
		})

		it("reports a key removed from the input", () => {
			const input: { a: number; removed?: string } = { a: 1 }
			expect(diff(input, { a: 1, removed: "yes" }, { output: "flat" })).toStrictEqual({
				removed: { path: "removed", inputValue: undefined, initialValue: "yes" },
			})
		})

		it("treats an undefined value and a missing key as equal", () => {
			const input: { a: number; b?: string } = { a: 1, b: undefined }
			expect(diff(input, { a: 1 })).toStrictEqual({})
		})

		it("reports a whole object that was added", () => {
			const input: { a: number; nested?: { x: number } } = { a: 1, nested: { x: 1 } }
			expect(diff(input, { a: 1 }, { output: "flat" })).toStrictEqual({
				nested: { path: "nested", inputValue: { x: 1 }, initialValue: undefined },
			})
		})

		it("reports an empty object vs undefined", () => {
			const input: { nested?: object } = { nested: {} }
			expect(diff(input, {}, { output: "flat" })).toStrictEqual({
				nested: { path: "nested", inputValue: {}, initialValue: undefined },
			})
		})

		it("reports a structural mismatch as a single entry with whole values", () => {
			const input = { value: { x: 1 } as object | number, list: [1] as number[] | object }
			const initial = { value: 5, list: { 0: 1 } }

			expect(looseDiff(input, initial, { output: "flat" })).toStrictEqual({
				value: { path: "value", inputValue: { x: 1 }, initialValue: 5 },
				list: { path: "list", inputValue: [1], initialValue: { 0: 1 } },
			})
		})

		it("does not resolve missing keys to inherited values", () => {
			expect(looseDiff({ toString: "x" }, {}, { output: "flat" })).toStrictEqual({
				toString: { path: "toString", inputValue: "x", initialValue: undefined },
			})
		})

		it("places keys named like Object.prototype members correctly in nested output", () => {
			const result = looseDiff({ constructor: { a: 1 } }, { constructor: { a: 2 } })

			// toStrictEqual can't be used on the root - it compares the (here overridden) `constructor` property
			expect(Object.keys(result)).toStrictEqual(["constructor"])
			expect(result.constructor).toStrictEqual({
				a: { path: "constructor.a", inputValue: 1, initialValue: 2 },
			})
		})

		it("ignores __proto__ keys", () => {
			const input = JSON.parse('{"__proto__": {"polluted": true}, "a": 1}') as object
			expect(looseDiff(input, { a: 1 })).toStrictEqual({})
			expect(({} as Record<string, unknown>).polluted).toBeUndefined()
		})

		it("compares objects created with Object.create(null)", () => {
			const input = Object.assign(Object.create(null) as object, { a: 1 })
			expect(looseDiff(input, { a: 2 }, { output: "flat" })).toStrictEqual({
				a: { path: "a", inputValue: 1, initialValue: 2 },
			})
		})
	})

	describe("arrays", () => {
		it("recurses into rows paired by index", () => {
			const input = createObject()
			input.nested.arr[1].value = "TWO"

			expect(diff(input, createObject(), { output: "flat" })).toStrictEqual({
				"nested.arr.1.value": { path: "nested.arr.1.value", inputValue: "TWO", initialValue: "two" },
			})
		})

		it("compares primitive arrays by index", () => {
			const input = createObject()
			input.d = ["first", "SECOND"]

			expect(diff(input, createObject(), { output: "flat" })).toStrictEqual({
				"d.1": { path: "d.1", inputValue: "SECOND", initialValue: "second" },
			})
		})

		it("reports an added row as a whole", () => {
			const input = createObject()
			input.nested.arr.push({ id: 3, value: "three" })

			expect(diff(input, createObject(), { output: "flat" })).toStrictEqual({
				"nested.arr.2": { path: "nested.arr.2", inputValue: { id: 3, value: "three" }, initialValue: undefined },
			})
		})

		it("reports a removed row as a whole", () => {
			const input = createObject()
			input.nested.arr.pop()

			expect(diff(input, createObject(), { output: "flat" })).toStrictEqual({
				"nested.arr.1": { path: "nested.arr.1", inputValue: undefined, initialValue: { id: 2, value: "two" } },
			})
		})

		it("reports all subsequent rows when a row is inserted in the middle", () => {
			const input = createObject()
			input.nested.arr.splice(0, 0, { id: 0, value: "zero" })

			expect(diff(input, createObject(), { output: "flat" })).toStrictEqual({
				"nested.arr.0.id": { path: "nested.arr.0.id", inputValue: 0, initialValue: 1 },
				"nested.arr.0.value": { path: "nested.arr.0.value", inputValue: "zero", initialValue: "one" },
				"nested.arr.1.id": { path: "nested.arr.1.id", inputValue: 1, initialValue: 2 },
				"nested.arr.1.value": { path: "nested.arr.1.value", inputValue: "one", initialValue: "two" },
				"nested.arr.2": { path: "nested.arr.2", inputValue: { id: 2, value: "two" }, initialValue: undefined },
			})
		})

		it("produces sparse arrays in nested output", () => {
			const input = { list: [1, 2, 3, 4] }
			const result = diff(input, { list: [1, 2, 3, 5] })

			expect(Array.isArray(result.list)).toBe(true)
			expect(result.list).toHaveLength(4)
			expect(0 in (result.list as unknown[])).toBe(false)
			expect((result.list as unknown[])[3]).toStrictEqual({ path: "list.3", inputValue: 4, initialValue: 5 })
		})

		it("treats sparse array holes as undefined", () => {
			// eslint-disable-next-line no-sparse-arrays
			expect(looseDiff({ list: [1, , 3] }, { list: [1, undefined, 3] })).toStrictEqual({})
		})

		it("uses a custom onArrayDiff handler and passes the array path", () => {
			const byId: ArrayDiffHandler = (inputArray, initialArray) => {
				const initialRows = initialArray as Row[]
				return (inputArray as Row[]).map((row, index) => ({
					index,
					inputValue: row,
					initialValue: initialRows.find((initialRow) => initialRow.id === row.id),
				}))
			}
			const onArrayDiff = vi.fn<ArrayDiffHandler>((inputArray, initialArray, context) =>
				context.path === "nested.arr" ? byId(inputArray, initialArray, context) : diffByIndex(inputArray, initialArray)
			)

			const input = createObject()
			input.nested.arr.splice(0, 0, { id: 0, value: "zero" })

			expect(diff(input, createObject(), { output: "flat", onArrayDiff })).toStrictEqual({
				"nested.arr.0": { path: "nested.arr.0", inputValue: { id: 0, value: "zero" }, initialValue: undefined },
			})
			expect(onArrayDiff).toHaveBeenCalledWith(input.nested.arr, expect.any(Array), { path: "nested.arr" })
			expect(onArrayDiff).toHaveBeenCalledWith(input.d, expect.any(Array), { path: "d" })
		})

		it("lets the last pair win when onArrayDiff repeats an index", () => {
			const onArrayDiff: ArrayDiffHandler = () => [
				{ index: 0, inputValue: { x: 1 }, initialValue: { x: 2 } },
				{ index: 0, inputValue: "a", initialValue: "b" },
			]
			expect(looseDiff({ list: [0] }, { list: [1] }, { onArrayDiff })).toStrictEqual({
				list: [{ path: "list.0", inputValue: "a", initialValue: "b" }],
			})
		})
	})

	describe("leaf values", () => {
		it("compares dates by value", () => {
			const input = { date: new Date(1000) }
			expect(diff(input, { date: new Date(1000) })).toStrictEqual({})
			expect(diff(input, { date: new Date(2000) }, { output: "flat" })).toStrictEqual({
				date: { path: "date", inputValue: new Date(1000), initialValue: new Date(2000) },
			})
		})

		it("reports a date compared against a string", () => {
			const input = { date: new Date(1000) as Date | string }
			const iso = new Date(1000).toISOString()
			expect(diff(input, { date: iso }, { output: "flat" })).toStrictEqual({
				date: { path: "date", inputValue: new Date(1000), initialValue: iso },
			})
		})

		it("treats NaN as equal to NaN", () => {
			expect(diff({ n: NaN }, { n: NaN })).toStrictEqual({})
		})

		it("reports null vs value", () => {
			const input = { value: null as string | null }
			expect(diff(input, { value: "x" }, { output: "flat" })).toStrictEqual({
				value: { path: "value", inputValue: null, initialValue: "x" },
			})
		})
	})

	describe("non-serializable values", () => {
		class Point {
			constructor(public x: number) {}
		}

		it.each([
			["function", () => 1, () => 2],
			["symbol", Symbol("a"), Symbol("b")],
			["bigint", BigInt(1), BigInt(2)],
			["Map", new Map([["a", 1]]), new Map([["a", 2]])],
			["Set", new Set([1]), new Set([2])],
			["RegExp", /a/, /b/],
			["class instance", new Point(1), new Point(2)],
			["boxed primitive", new String("a"), new String("b")],
		])("skips %s", (_, inputValue, initialValue) => {
			expect(looseDiff({ value: inputValue }, { value: initialValue })).toStrictEqual({})
		})

		it("skips when only one side is non-serializable", () => {
			expect(looseDiff({ value: new Map() }, { value: {} })).toStrictEqual({})
			expect(looseDiff({ value: "x" }, { value: () => "x" })).toStrictEqual({})
		})

		it("skips non-serializable array items", () => {
			expect(looseDiff({ list: [() => 1, 1] }, { list: [() => 2, 2] }, { output: "flat" })).toStrictEqual({
				"list.1": { path: "list.1", inputValue: 1, initialValue: 2 },
			})
		})
	})

	describe("references", () => {
		it("terminates on circular references and still reports other differences", () => {
			const input: Record<string, unknown> = { a: 1 }
			input.self = input
			const initial: Record<string, unknown> = { a: 2 }
			initial.self = initial

			expect(looseDiff(input, initial, { output: "flat" })).toStrictEqual({
				a: { path: "a", inputValue: 1, initialValue: 2 },
			})
		})

		it("terminates when only one side is circular", () => {
			const input: Record<string, unknown> = { a: 1 }
			input.self = input

			expect(looseDiff(input, { a: 1, self: { a: 1 } })).toStrictEqual({})
		})

		it("still compares shared (non-circular) references", () => {
			const shared = { x: 1 }
			const input = { first: shared, second: shared }

			expect(diff(input, { first: { x: 1 }, second: { x: 2 } }, { output: "flat" })).toStrictEqual({
				"second.x": { path: "second.x", inputValue: 1, initialValue: 2 },
			})
		})

		it("does not walk identical references", () => {
			const isEqual = vi.fn((inputValue: unknown, initialValue: unknown, _path: string) =>
				isEqualLeaf(inputValue, initialValue)
			)
			const input = createObject()

			expect(diff(input, { ...input, a: "Changed" }, { isEqual, output: "flat" })).toStrictEqual({
				a: { path: "a", inputValue: "Hello", initialValue: "Changed" },
			})
			expect(isEqual.mock.calls.map(([, , path]) => path)).toStrictEqual(["a", "b", "c"])
		})

		it("does not mutate the inputs and references the original values", () => {
			const input = createObject()
			input.nested.arr.push({ id: 3, value: "three" })
			const initial = createObject()
			const inputSnapshot = structuredClone(input)
			const initialSnapshot = structuredClone(initial)

			const result = diff(input, initial, { output: "flat" })

			expect(input).toStrictEqual(inputSnapshot)
			expect(initial).toStrictEqual(initialSnapshot)
			expect(result["nested.arr.2"]?.inputValue).toBe(input.nested.arr[2])
		})
	})

	describe("options.isEqual", () => {
		it("overrides the leaf comparison", () => {
			const input = { name: " John ", age: 30 }
			const isEqual = (inputValue: unknown, initialValue: unknown, path: string) =>
				path === "name"
					? String(inputValue).trim() === String(initialValue).trim()
					: isEqualLeaf(inputValue, initialValue)

			expect(diff(input, { name: "John", age: 31 }, { isEqual, output: "flat" })).toStrictEqual({
				age: { path: "age", inputValue: 30, initialValue: 31 },
			})
		})

		it("can force a difference", () => {
			expect(diff({ a: 1 }, { a: 1 }, { isEqual: () => false, output: "flat" })).toStrictEqual({
				a: { path: "a", inputValue: 1, initialValue: 1 },
			})
		})

		it("is called for Date leaves", () => {
			const isEqual = vi.fn(() => true)
			expect(diff({ date: new Date(1) }, { date: new Date(2) }, { isEqual })).toStrictEqual({})
			expect(isEqual).toHaveBeenCalledWith(new Date(1), new Date(2), "date")
		})

		it("is not called for structural mismatches or containers", () => {
			const isEqual = vi.fn(() => true)
			const input = { value: { x: 1 } as object | number }

			expect(diff(input, { value: 5 }, { isEqual, output: "flat" })).toStrictEqual({
				value: { path: "value", inputValue: { x: 1 }, initialValue: 5 },
			})
			expect(isEqual).not.toHaveBeenCalled()
		})
	})

	describe("options.ignore", () => {
		it("skips a leaf", () => {
			const input = createObject()
			input.a = "Changed"
			input.b = 99

			expect(diff(input, createObject(), { ignore: (path) => path === "a", output: "flat" })).toStrictEqual({
				b: { path: "b", inputValue: 99, initialValue: 12 },
			})
		})

		it("skips a whole subtree", () => {
			const input = createObject()
			input.nested.value = "Changed"
			input.nested.arr[0].value = "Changed"
			input.c = true

			expect(diff(input, createObject(), { ignore: (path) => path === "nested", output: "flat" })).toStrictEqual({
				c: { path: "c", inputValue: true, initialValue: false },
			})
		})

		it("receives array index paths", () => {
			const ignore = vi.fn((path: string) => path === "d.1")
			const input = createObject()
			input.d = ["FIRST", "SECOND"]

			expect(diff(input, createObject(), { ignore, output: "flat" })).toStrictEqual({
				"d.0": { path: "d.0", inputValue: "FIRST", initialValue: "first" },
			})
			expect(ignore).toHaveBeenCalledWith("d.1")
		})
	})

	describe("roots", () => {
		it("treats a null initial as an empty object", () => {
			expect(looseDiff({ a: 1, b: { c: 2 } }, null, { output: "flat" })).toStrictEqual({
				a: { path: "a", inputValue: 1, initialValue: undefined },
				b: { path: "b", inputValue: { c: 2 }, initialValue: undefined },
			})
		})

		it("treats an initial of a different container kind as empty", () => {
			expect(looseDiff({ a: 1 }, [1], { output: "flat" })).toStrictEqual({
				a: { path: "a", inputValue: 1, initialValue: undefined },
			})
		})

		it("reports removed values when the input root is missing", () => {
			expect(looseDiff(undefined, { a: 1 }, { output: "flat" })).toStrictEqual({
				a: { path: "a", inputValue: undefined, initialValue: 1 },
			})
		})

		it("returns an empty result when a root is non-serializable", () => {
			expect(looseDiff(new Map([["a", 1]]), { a: 1 })).toStrictEqual({})
		})
	})

	describe("serializable fixture", () => {
		describe("equal values", () => {
			it("returns no differences for equal copies", () => {
				const input = createSerializable()

				expect(diff(input, createSerializable())).toStrictEqual({})
				expect(diff(input, createSerializable(), { output: "flat" })).toStrictEqual({})
				expect(diff(input, structuredClone(input))).toStrictEqual({})
				expect(diff(input, input)).toStrictEqual({})
			})

			it("returns no differences when every optional value is filled in on both sides", () => {
				const create = (): SerializableTest => ({
					...createSerializable(),
					nullable: "set",
					maybe: "defined",
					optional: 0,
					deletedAt: day(10),
					settings: { theme: "dark", fontSize: 12 },
					extras: { note: "hi", nested: { level: 1 }, list: [1, 2] },
				})

				expect(diff(create(), create())).toStrictEqual({})
				expect(diff(create(), create(), { output: "flat" })).toStrictEqual({})
			})

			it("treats undefined and missing keys, NaN, and dates with the same time as equal", () => {
				const input = createSerializable()
				input.optional = undefined
				input.settings = undefined
				input.count = NaN
				input.createdAt = new Date(input.createdAt.getTime())
				input.history = [new Date(NaN), day(3)]

				const initial = createSerializable()
				initial.count = NaN
				initial.history = [new Date(NaN), day(3)]

				expect(diff(input, initial)).toStrictEqual({})
				expect(diff(initial, input, { output: "flat" })).toStrictEqual({})
			})

			it("returns no differences for replaced but equal objects and arrays", () => {
				const input = createSerializable()
				input.company.address = { city: "Prague", geo: { lat: 50.08, lng: 14.43 } }
				input.tags = [...input.tags]
				input.order.lines = input.order.lines.map((line) => ({ ...line }))
				input.root = structuredClone(input.root)
				input.matrix = input.matrix.map((row) => [...row])
				input.board = input.board.map((row) => row.map((cell) => ({ ...cell })))

				expect(diff(input, createSerializable())).toStrictEqual({})
			})

			it("returns no differences for empty arrays and empty objects on both sides", () => {
				const create = (): SerializableTest => ({
					...createSerializable(),
					tags: [],
					history: [],
					extras: {},
					order: { ids: [], lines: [] },
					root: { name: "empty", children: [] },
					matrix: [[], []],
					board: [[]],
				})

				expect(diff(create(), create())).toStrictEqual({})
			})

			it("returns no differences for a deeply recursive folder tree", () => {
				const input = createSerializable()
				input.root = createFolderChain(100, "deep.txt")
				const initial = createSerializable()
				initial.root = createFolderChain(100, "deep.txt")

				expect(diff(input, initial)).toStrictEqual({})
			})
		})

		describe("changed values", () => {
			it("reports changed primitives, null and undefined at the root", () => {
				const input = createSerializable()
				input.text = "Hi"
				input.count = 1
				input.flag = true
				input.nullable = "set"
				input.maybe = "defined"
				input.optional = 0

				expect(diff(input, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(
						entry("text", "Hi", "Hello"),
						entry("count", 1, 0),
						entry("flag", true, false),
						entry("nullable", "set", null),
						entry("maybe", "defined", undefined),
						entry("optional", 0, undefined)
					)
				)
				// values set back to null / undefined
				expect(diff(createSerializable(), input, { output: "flat" })).toStrictEqual(
					flatOf(
						entry("text", "Hello", "Hi"),
						entry("count", 0, 1),
						entry("flag", false, true),
						entry("nullable", null, "set"),
						entry("maybe", undefined, "defined"),
						entry("optional", undefined, 0)
					)
				)
				// null and undefined are different values
				expect(diff(createSerializable(), { nullable: undefined }, { output: "flat" })).toMatchObject({
					nullable: entry("nullable", null, undefined),
				})

				const nan = createSerializable()
				nan.count = NaN
				expect(diff(nan, createSerializable(), { output: "flat" })).toStrictEqual(flatOf(entry("count", NaN, 0)))
			})

			it("reports changed, added and removed items of primitive arrays", () => {
				const input = createSerializable()
				input.tags = ["a", "B", "c"]
				input.scores = [10]

				expect(diff(input, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(
						entry("tags.1", "B", "b"),
						entry("tags.2", "c", undefined),
						entry("scores.1", undefined, 20),
						entry("scores.2", undefined, 30)
					)
				)

				const emptied = createSerializable()
				emptied.tags = []
				expect(diff(emptied, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("tags.0", undefined, "a"), entry("tags.1", undefined, "b"))
				)
				expect(diff(createSerializable(), emptied, { output: "flat" })).toStrictEqual(
					flatOf(entry("tags.0", "a", undefined), entry("tags.1", "b", undefined))
				)
			})

			it("reports changed dates as values and inside arrays", () => {
				const input = createSerializable()
				input.createdAt = new Date(day(1).getTime() + 1)
				input.deletedAt = day(10)
				input.history[1] = day(20)
				input.history.push(day(30))

				expect(diff(input, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(
						entry("createdAt", new Date(day(1).getTime() + 1), day(1)),
						entry("deletedAt", day(10), null),
						entry("history.1", day(20), day(3)),
						entry("history.2", day(30), undefined)
					)
				)

				const invalid = new Date(NaN)
				const shortened = createSerializable()
				shortened.history = [invalid]
				expect(diff(shortened, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("history.0", invalid, day(2)), entry("history.1", undefined, day(3)))
				)
			})

			it("reports optional objects that were added, removed or changed", () => {
				const withSettings = createSerializable()
				withSettings.settings = { theme: "dark", fontSize: 12 }

				expect(diff(withSettings, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("settings", { theme: "dark", fontSize: 12 }, undefined))
				)
				expect(diff(createSerializable(), withSettings, { output: "flat" })).toStrictEqual(
					flatOf(entry("settings", undefined, { theme: "dark", fontSize: 12 }))
				)

				const changed = createSerializable()
				changed.settings = { theme: "dark", fontSize: 14 }
				expect(diff(changed, withSettings, { output: "flat" })).toStrictEqual(
					flatOf(entry("settings.fontSize", 14, 12))
				)
				expect(diff(changed, withSettings)).toStrictEqual({
					settings: { fontSize: entry("settings.fontSize", 14, 12) },
				})
			})

			it("reports changes in mandatory and empty objects", () => {
				const input = createSerializable()
				input.profile.lastName = "Smith"
				input.extras = { note: "hi", nested: { level: 1 } }

				expect(diff(input, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(
						entry("profile.lastName", "Smith", "Doe"),
						entry("extras.note", "hi", undefined),
						entry("extras.nested", { level: 1 }, undefined)
					)
				)
				expect(diff(createSerializable(), input, { output: "flat" })).toStrictEqual(
					flatOf(
						entry("profile.lastName", "Doe", "Smith"),
						entry("extras.note", undefined, "hi"),
						entry("extras.nested", undefined, { level: 1 })
					)
				)
			})

			it("reports changes in objects containing arrays", () => {
				const input = createSerializable()
				input.order.ids.push(3)
				input.order.lines[0].value = "ONE"
				input.order.lines.pop()

				expect(diff(input, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(
						entry("order.ids.2", 3, undefined),
						entry("order.lines.0.value", "ONE", "one"),
						entry("order.lines.1", undefined, { id: 2, value: "two" })
					)
				)
				expect(diff(input, createSerializable())).toStrictEqual({
					order: {
						ids: sparse({ 2: entry("order.ids.2", 3, undefined) }),
						lines: [
							{ value: entry("order.lines.0.value", "ONE", "one") },
							entry("order.lines.1", undefined, { id: 2, value: "two" }),
						],
					},
				})
			})

			it("reports changes in objects containing other objects", () => {
				const input = createSerializable()
				input.company.name = "Acme Corp"
				input.company.address.geo.lat = 51

				expect(diff(input, createSerializable())).toStrictEqual({
					company: {
						name: entry("company.name", "Acme Corp", "Acme"),
						address: { geo: { lat: entry("company.address.geo.lat", 51, 50.08) } },
					},
				})
				expect(diff(input, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("company.name", "Acme Corp", "Acme"), entry("company.address.geo.lat", 51, 50.08))
				)
			})

			it("reports changes in a recursive folder tree", () => {
				const renamed = createSerializable()
				renamed.root.children[0].children[1].children[0].name = "walk.ts"
				expect(diff(renamed, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("root.children.0.children.1.children.0.name", "walk.ts", "diff.ts"))
				)
				expect(diff(renamed, createSerializable())).toStrictEqual({
					root: {
						children: [
							{
								children: sparse({
									1: {
										children: [{ name: entry("root.children.0.children.1.children.0.name", "walk.ts", "diff.ts") }],
									},
								}),
							},
						],
					},
				})

				// README.md becomes a folder
				const fileToFolder = createSerializable()
				fileToFolder.root.children[1].children.push({ name: "notes.md", children: [] })
				expect(diff(fileToFolder, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("root.children.1.children.0", { name: "notes.md", children: [] }, undefined))
				)

				// utils becomes a file
				const folderToFile = createSerializable()
				folderToFile.root.children[0].children[1].children = []
				expect(diff(folderToFile, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("root.children.0.children.1.children.0", undefined, { name: "diff.ts", children: [] }))
				)

				const added = createSerializable()
				added.root.children.push({ name: "LICENSE", children: [] })
				expect(diff(added, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("root.children.2", { name: "LICENSE", children: [] }, undefined))
				)
			})

			it("reports every shifted folder when one is inserted at the start", () => {
				const input = createSerializable()
				input.root.children.unshift({ name: "a.txt", children: [] })
				const [src, readme] = createSerializable().root.children

				expect(diff(input, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(
						entry("root.children.0.name", "a.txt", "src"),
						entry("root.children.0.children.0", undefined, src.children[0]),
						entry("root.children.0.children.1", undefined, src.children[1]),
						entry("root.children.1.name", "src", "README.md"),
						entry("root.children.1.children.0", src.children[0], undefined),
						entry("root.children.1.children.1", src.children[1], undefined),
						entry("root.children.2", readme, undefined)
					)
				)
			})

			it("reports changes deep inside a recursive folder tree", () => {
				const input = createSerializable()
				input.root = createFolderChain(100, "renamed.txt")
				const initial = createSerializable()
				initial.root = createFolderChain(100, "deep.txt")
				const leafPath = `root${".children.0".repeat(100)}`

				expect(diff(input, initial, { output: "flat" })).toStrictEqual(
					flatOf(entry(`${leafPath}.name`, "renamed.txt", "deep.txt"))
				)

				// the deepest file becomes a folder
				const deeper = createSerializable()
				deeper.root = createFolderChain(100, "deep.txt")
				let leaf = deeper.root
				while (leaf.children.length > 0) leaf = leaf.children[0]
				leaf.children.push({ name: "child.txt", children: [] })

				expect(diff(deeper, initial, { output: "flat" })).toStrictEqual(
					flatOf(entry(`${leafPath}.children.0`, { name: "child.txt", children: [] }, undefined))
				)
			})

			it("reports changes in arrays of arrays with primitive values", () => {
				const input = createSerializable()
				input.matrix[1][0] = 30
				input.matrix[0].push(9)
				input.matrix.push([5])

				expect(diff(input, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("matrix.0.2", 9, undefined), entry("matrix.1.0", 30, 3), entry("matrix.2", [5], undefined))
				)

				const removedRow = createSerializable()
				removedRow.matrix = [[1, 2]]
				expect(diff(removedRow, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("matrix.1", undefined, [3, 4]))
				)

				const emptiedRow = createSerializable()
				emptiedRow.matrix[0] = []
				expect(diff(emptiedRow, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("matrix.0.0", undefined, 1), entry("matrix.0.1", undefined, 2))
				)
			})

			it("reports changes in arrays of arrays with objects", () => {
				const input = createSerializable()
				input.board[0][1].value = "A2"
				input.board[1].push({ id: 4, value: "b2" })
				input.board.push([])

				expect(diff(input, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(
						entry("board.0.1.value", "A2", "a2"),
						entry("board.1.1", { id: 4, value: "b2" }, undefined),
						entry("board.2", [], undefined)
					)
				)

				const emptiedRow = createSerializable()
				emptiedRow.board[1] = []
				expect(diff(emptiedRow, createSerializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("board.1.0", undefined, { id: 3, value: "b1" }))
				)
			})

			it("reports many changes at once in the same way in nested and flat output", () => {
				const input = createSerializable()
				input.text = "Hi"
				input.tags[1] = "B"
				input.history[0] = day(5)
				input.settings = { theme: "dark", fontSize: 12 }
				input.order.lines[1].value = "TWO"
				input.company.address.city = "Brno"
				input.root.children[1].name = "README.txt"
				input.matrix[0][1] = 20
				input.board[1][0].id = 30

				const flat = diff(input, createSerializable(), { output: "flat" })
				expect(flat).toStrictEqual(
					flatOf(
						entry("text", "Hi", "Hello"),
						entry("tags.1", "B", "b"),
						entry("history.0", day(5), day(2)),
						entry("settings", { theme: "dark", fontSize: 12 }, undefined),
						entry("order.lines.1.value", "TWO", "two"),
						entry("company.address.city", "Brno", "Prague"),
						entry("root.children.1.name", "README.txt", "README.md"),
						entry("matrix.0.1", 20, 2),
						entry("board.1.0.id", 30, 3)
					)
				)
				expect(diff(input, createSerializable())).toStrictEqual({
					text: flat.text,
					tags: sparse({ 1: flat["tags.1"] }),
					history: [flat["history.0"]],
					settings: flat.settings,
					order: { lines: sparse({ 1: { value: flat["order.lines.1.value"] } }) },
					company: { address: { city: flat["company.address.city"] } },
					root: { children: sparse({ 1: { name: flat["root.children.1.name"] } }) },
					matrix: [sparse({ 1: flat["matrix.0.1"] })],
					board: sparse({ 1: [{ id: flat["board.1.0.id"] }] }),
				})
			})
		})
	})

	describe("fixture with unserializable values", () => {
		describe("equal values", () => {
			it("returns no differences for separately created copies", () => {
				const input = createUnserializable()
				const initial = createUnserializable()

				// sanity check - unserializable values really differ and the folder tree is circular
				expect(input.format).not.toBe(initial.format)
				expect(input.id).not.toBe(initial.id)
				expect(input.root.children[0].parent).toBe(input.root)

				expect(diff(input, initial)).toStrictEqual({})
				expect(diff(input, initial, { output: "flat" })).toStrictEqual({})
				expect(diff(input, input)).toStrictEqual({})
			})

			it("ignores changes that only touch unserializable values at every level", () => {
				const input = createUnserializable()
				input.format = (value) => value.toUpperCase()
				input.id = Symbol("other")
				input.big = BigInt(2)
				input.lookup = new Map([["b", 2]])
				input.unique = new Set(["b"])
				input.pattern = /bye/
				input.position = new Coordinates(9, 9)
				input.onClose = () => undefined
				input.callbacks = [() => undefined]
				input.mixed[1] = () => "changed"
				input.mixed[2] = new Map()
				input.profile.getFullName = () => "Someone else"
				input.profile.labels = new Set()
				input.order.lines[0].onSelect = () => undefined
				input.order.total = BigInt(99)
				input.root.children[0].onOpen = () => undefined
				input.root.children[0].children[1].children[0].onOpen = () => undefined
				input.board[1][0].meta = new Map()

				expect(diff(input, createUnserializable())).toStrictEqual({})
				expect(diff(input, createUnserializable(), { output: "flat" })).toStrictEqual({})
			})

			it("skips values that are unserializable on one side only", () => {
				const input = createUnserializable()
				input.title = "Changed"
				input.mixed[1] = "b"

				const initial = createUnserializable()
				initial.position = { x: 9, y: 9 }
				initial.onClose = () => undefined

				expect(diff(input, initial)).toStrictEqual({})
				expect(diff(input, { ...initial, lookup: {}, unique: ["a"] }, { output: "flat" })).toStrictEqual({})
			})
		})

		describe("changed values", () => {
			it("reports serializable changes at the root next to changed unserializable values", () => {
				const input = createUnserializable()
				input.text = "Hi"
				input.nullable = "set"
				input.optional = 5
				input.tags.push("c")
				input.createdAt = day(5)
				input.history.pop()
				input.matrix[1][1] = 40
				input.format = (value) => value
				input.big = BigInt(5)
				input.lookup.set("a", 99)

				expect(diff(input, createUnserializable(), { output: "flat" })).toStrictEqual(
					flatOf(
						entry("text", "Hi", "Hello"),
						entry("nullable", "set", null),
						entry("optional", 5, undefined),
						entry("tags.2", "c", undefined),
						entry("createdAt", day(5), day(1)),
						entry("history.1", undefined, day(3)),
						entry("matrix.1.1", 40, 4)
					)
				)
			})

			it("reports serializable changes inside objects holding unserializable values", () => {
				const input = createUnserializable()
				input.profile.firstName = "John"
				input.profile.getFullName = () => "John Doe"
				input.order.ids = [1]
				input.order.lines[1].value = "TWO"
				input.order.lines[1].onSelect = () => undefined
				input.order.total = BigInt(1)
				input.settings = { theme: "dark", fontSize: 12 }
				input.company.address.geo.lng = 15

				expect(diff(input, createUnserializable(), { output: "flat" })).toStrictEqual(
					flatOf(
						entry("profile.firstName", "John", "Jane"),
						entry("order.ids.1", undefined, 2),
						entry("order.lines.1.value", "TWO", "two"),
						entry("settings", { theme: "dark", fontSize: 12 }, undefined),
						entry("company.address.geo.lng", 15, 14.43)
					)
				)
			})

			it("reports added and removed rows as a whole even when they contain unserializable values", () => {
				const row = { id: 3, value: "three", onSelect: () => undefined }
				const input = createUnserializable()
				input.order.lines.push(row)

				expect(diff(input, createUnserializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("order.lines.2", row, undefined))
				)
				expect(diff(createUnserializable(), input, { output: "flat" })).toStrictEqual(
					flatOf(entry("order.lines.2", undefined, row))
				)
			})

			it("reports changes in a recursive folder tree with callbacks and circular parents", () => {
				const renamed = createUnserializable()
				renamed.root.children[0].children[1].children[0].name = "walk.ts"
				renamed.root.children[0].children[1].children[0].onOpen = () => undefined
				expect(diff(renamed, createUnserializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("root.children.0.children.1.children.0.name", "walk.ts", "diff.ts"))
				)

				const added = createUnserializable()
				const license: InteractiveFolder = {
					name: "LICENSE",
					children: [],
					onOpen: () => undefined,
					parent: added.root,
				}
				added.root.children.push(license)
				expect(diff(added, createUnserializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("root.children.2", license, undefined))
				)

				// utils becomes a file
				const folderToFile = createUnserializable()
				folderToFile.root.children[0].children[1].children = []
				const initial = createUnserializable()
				expect(diff(folderToFile, initial, { output: "flat" })).toStrictEqual(
					flatOf(
						entry("root.children.0.children.1.children.0", undefined, initial.root.children[0].children[1].children[0])
					)
				)
			})

			it("reports only serializable items of arrays mixing serializable and unserializable values", () => {
				const input = createUnserializable()
				input.mixed = ["A", () => "changed", new Map(), "d", () => "e"]
				input.callbacks.push(() => undefined)

				expect(diff(input, createUnserializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("mixed.0", "A", "a"), entry("mixed.3", "d", undefined))
				)
			})

			it("reports changes in arrays of arrays with objects holding unserializable values", () => {
				const cell = { id: 4, value: "b2", meta: new Map<string, string>() }
				const input = createUnserializable()
				input.board[0][0].value = "A1"
				input.board[0][0].meta = new Map()
				input.board[1].push(cell)

				expect(diff(input, createUnserializable(), { output: "flat" })).toStrictEqual(
					flatOf(entry("board.0.0.value", "A1", "a1"), entry("board.1.1", cell, undefined))
				)
			})

			it("reports many changes at once in the same way in nested and flat output", () => {
				const input = createUnserializable()
				input.text = "Hi"
				input.profile.firstName = "John"
				input.root.children[1].name = "README.txt"
				input.mixed[0] = "A"
				input.board[1][0].id = 30
				input.id = Symbol("other")
				input.profile.labels = new Set()
				input.root.children[1].onOpen = () => undefined
				input.mixed[1] = () => "changed"
				input.board[1][0].meta = new Map()

				const flat = diff(input, createUnserializable(), { output: "flat" })
				expect(flat).toStrictEqual(
					flatOf(
						entry("text", "Hi", "Hello"),
						entry("profile.firstName", "John", "Jane"),
						entry("root.children.1.name", "README.txt", "README.md"),
						entry("mixed.0", "A", "a"),
						entry("board.1.0.id", 30, 3)
					)
				)
				expect(diff(input, createUnserializable())).toStrictEqual({
					text: flat.text,
					profile: { firstName: flat["profile.firstName"] },
					root: { children: sparse({ 1: { name: flat["root.children.1.name"] } }) },
					mixed: [flat["mixed.0"]],
					board: sparse({ 1: [{ id: flat["board.1.0.id"] }] }),
				})
			})
		})
	})
})
