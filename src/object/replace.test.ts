import { describe, expect, it } from "vitest"
import { replace } from "~/object/replace"

type Row = { id: number; value: string }

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

function createObject(): Test {
	return {
		a: "Hello",
		b: 12,
		c: false,
		d: ["first", "second"],
		nested: {
			arr: [
				{ key: "an", value: "ANO" },
				{ key: "non", value: "No" },
			],
			value: "Hey there",
			deep: {
				here: true,
			},
		},
	}
}

// Loosely typed wrapper for runtime edge cases that the static types intentionally reject
const looseReplace = replace as (object: unknown, key: string, value: unknown) => Record<string, unknown>

/** Folder with an empty `children` array is a file */
type Folder = { name: string; children: Folder[] }

/** Contains only plain data values */
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

/** Everything from {@link SerializableTest} plus functions, symbols, maps, class instances, … at every level */
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
		// │       └── replace.ts
		// └── README.md
		root: {
			name: "root",
			children: [
				{
					name: "src",
					children: [
						{ name: "index.ts", children: [] },
						{ name: "utils", children: [{ name: "replace.ts", children: [] }] },
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

/** Expected result of a replace - a fresh fixture changed in place */
function expected(change: (value: SerializableTest) => void): SerializableTest {
	const value = createSerializable()
	change(value)
	return value
}

/** Asserts that every root key of `result` except `changedKeys` is the very same reference as in `input` */
function expectSameRootReferences<T extends object>(result: T, input: T, ...changedKeys: (keyof T)[]) {
	for (const key of Object.keys(input) as (keyof T)[]) {
		if (!changedKeys.includes(key)) expect(result[key], String(key)).toBe(input[key])
	}
}

describe("replace", () => {
	describe("paths", () => {
		it("replaces a top-level primitive", () => {
			expect(replace(createObject(), "a", "changed").a).toBe("changed")
		})

		it("replaces a nested value without touching siblings", () => {
			const result = replace(createObject(), "nested.value", "changed")
			expect(result.nested.value).toBe("changed")
			expect(result.nested.deep).toStrictEqual({ here: true })
		})

		it("replaces a single array element field by index", () => {
			const result = replace(createObject(), "nested.arr.0.key", "changed")
			expect(result.nested.arr[0]).toStrictEqual({ key: "changed", value: "ANO" })
			expect(result.nested.arr[1]).toStrictEqual({ key: "non", value: "No" })
		})

		it("replaces a whole array element", () => {
			const result = replace(createObject(), "nested.arr.0", { key: "x", value: "y" })
			expect(result.nested.arr[0]).toStrictEqual({ key: "x", value: "y" })
			expect(result.nested.arr[1]).toStrictEqual({ key: "non", value: "No" })
		})

		it("replaces a primitive array element", () => {
			const result = replace(createObject(), "d.1", "SECOND")
			expect(result.d).toStrictEqual(["first", "SECOND"])
		})

		it("replaces a whole nested object", () => {
			const result = replace(createObject(), "nested.deep", { here: false })
			expect(result.nested.deep).toStrictEqual({ here: false })
			expect(result.nested.value).toBe("Hey there")
		})
	})

	describe("keys", () => {
		it("keeps numeric-looking keys of existing plain objects as object keys", () => {
			const input: { byId: Record<string, Row> } = { byId: { "1": { id: 1, value: "one" } } }

			const changed = replace(input, "byId.1.value", "ONE")
			expect(Array.isArray(changed.byId)).toBe(false)
			expect(changed.byId).toStrictEqual({ "1": { id: 1, value: "ONE" } })

			const added = replace(input, "byId.2", { id: 2, value: "two" })
			expect(Array.isArray(added.byId)).toBe(false)
			expect(added.byId).toStrictEqual({ "1": { id: 1, value: "one" }, "2": { id: 2, value: "two" } })
		})

		it("replaces in an array root and returns an array", () => {
			const input = ["a", "b", "c"]
			const result = replace(input, "1", "B")

			expect(Array.isArray(result)).toBe(true)
			expect(result).toStrictEqual(["a", "B", "c"])
			expect(result).not.toBe(input)
			expect(input).toStrictEqual(["a", "b", "c"])
		})

		it("replaces own keys named like Object.prototype members", () => {
			const input = { constructor: { name: "custom" }, toString: "text" }
			const result = replace(replace(input, "constructor.name", "changed"), "toString", "TEXT")

			expect(Object.keys(result)).toStrictEqual(["constructor", "toString"])
			expect(result.constructor).toStrictEqual({ name: "changed" })
			expect(result.toString).toBe("TEXT")
			expect(input.constructor).toStrictEqual({ name: "custom" })
		})

		it("replaces values of objects created with Object.create(null)", () => {
			const inner = Object.assign(Object.create(null) as object, { value: 1, other: 2 })
			const input = Object.assign(Object.create(null) as object, { inner })

			const result = looseReplace(input, "inner.value", 10)
			expect(result.inner).toMatchObject({ value: 10, other: 2 })
			expect(inner).toMatchObject({ value: 1, other: 2 })
		})

		it("does not pollute Object.prototype", () => {
			looseReplace({}, "__proto__.polluted", true)
			looseReplace({}, "constructor.prototype.polluted", true)
			looseReplace([], "__proto__.polluted", true)

			expect(({} as Record<string, unknown>).polluted).toBeUndefined()
			expect(Object.hasOwn(Object.prototype, "polluted")).toBe(false)
			expect(Object.hasOwn(Array.prototype, "polluted")).toBe(false)
		})
	})

	describe("missing containers", () => {
		it("creates a missing object", () => {
			const input: { a: number; nested?: { x: number; y: number } } = { a: 1 }

			expect(replace(input, "nested.x", 5)).toStrictEqual({ a: 1, nested: { x: 5 } })
			expect(input).toStrictEqual({ a: 1 })
		})

		it("creates a missing array when the next segment is an index", () => {
			const input: { items?: Row[] } = {}
			const result = replace(input, "items.0.value", "x")

			expect(Array.isArray(result.items)).toBe(true)
			expect(result).toStrictEqual({ items: [{ value: "x" }] })
		})

		it("creates holes when setting an index beyond the array length", () => {
			const input: { items?: string[] } = {}
			const items = replace(input, "items.2", "c").items ?? []

			expect(items).toHaveLength(3)
			expect(0 in items).toBe(false)
			expect(1 in items).toBe(false)
			expect(items[2]).toBe("c")
		})

		it("replaces a null container with a new one", () => {
			const input: { manager: { name: string } | null; list: string[] | null } = { manager: null, list: null }

			expect(looseReplace(input, "manager.name", "Jane")).toStrictEqual({ manager: { name: "Jane" }, list: null })
			expect(looseReplace(input, "list.0", "a")).toStrictEqual({ manager: null, list: ["a"] })
			expect(input).toStrictEqual({ manager: null, list: null })
		})

		it("creates the whole path when the root is null or undefined", () => {
			expect(looseReplace(undefined, "a", 1)).toStrictEqual({ a: 1 })
			expect(looseReplace(null, "a.b", 1)).toStrictEqual({ a: { b: 1 } })
			expect(looseReplace(undefined, "a.0.b", 1)).toStrictEqual({ a: [{ b: 1 }] })

			const matrix = looseReplace(undefined, "a.0.1", 1).a as unknown[][]
			expect(Array.isArray(matrix)).toBe(true)
			expect(Array.isArray(matrix[0])).toBe(true)
			expect(matrix[0]).toHaveLength(2)
			expect(0 in matrix[0]).toBe(false)
			expect(matrix[0][1]).toBe(1)
		})
	})

	describe("references", () => {
		it("does not mutate the input", () => {
			const original = createObject()
			const result = replace(original, "nested.arr.0.key", "changed")

			expect(original.nested.arr[0].key).toBe("an")
			expect(original).toStrictEqual(createObject())
			expect(result).not.toBe(original)
			expect(result.nested).not.toBe(original.nested)
			expect(result.nested.arr).not.toBe(original.nested.arr)
		})

		it("inserts the given value by reference", () => {
			const row = { key: "x", value: "y" }
			const deep = { here: false }

			expect(replace(createObject(), "nested.arr.1", row).nested.arr[1]).toBe(row)
			expect(replace(createObject(), "nested.deep", deep).nested.deep).toBe(deep)
		})

		it("returns a new object even when the value does not change", () => {
			const input = createObject()
			const result = replace(input, "nested.deep.here", true)

			expect(result).not.toBe(input)
			expect(result.nested.deep).not.toBe(input.nested.deep)
			expect(result).toStrictEqual(input)
		})
	})

	describe("serializable fixture", () => {
		describe("root values", () => {
			it("replaces primitives at the root", () => {
				const input = createSerializable()

				expect(replace(input, "text", "Hi")).toStrictEqual(expected((value) => (value.text = "Hi")))
				expect(replace(input, "count", 1)).toStrictEqual(expected((value) => (value.count = 1)))
				expect(replace(input, "flag", true)).toStrictEqual(expected((value) => (value.flag = true)))
				expect(replace(input, "count", NaN).count).toBeNaN()
				expect(replace(input, "optional", 0)).toStrictEqual(expected((value) => (value.optional = 0)))
			})

			it("replaces values with and back from null and undefined", () => {
				const input = createSerializable()

				const filled = replace(replace(input, "nullable", "set"), "maybe", "defined")
				expect(filled.nullable).toBe("set")
				expect(filled.maybe).toBe("defined")

				const cleared = replace(replace(filled, "nullable", null), "maybe", undefined)
				expect(cleared).toStrictEqual(input)
				expect("maybe" in cleared).toBe(true)

				const withSettings = replace(input, "settings", { theme: "dark", fontSize: 12 })
				expect(looseReplace(withSettings, "settings", undefined)).toStrictEqual({ ...input, settings: undefined })
			})

			it("replaces dates as values and inside arrays", () => {
				const input = createSerializable()

				const result = replace(replace(replace(input, "createdAt", day(5)), "deletedAt", day(10)), "history.1", day(20))
				expect(result).toStrictEqual(
					expected((value) => {
						value.createdAt = day(5)
						value.deletedAt = day(10)
						value.history[1] = day(20)
					})
				)
				expect(result.history[0]).toBe(input.history[0])
				expect(input.history[1]).toStrictEqual(day(3))
			})

			it("keeps every untouched root value by reference", () => {
				const input = createSerializable()

				expectSameRootReferences(replace(input, "text", "Hi"), input, "text")
				expectSameRootReferences(replace(input, "company.address.city", "Brno"), input, "company")
				expectSameRootReferences(replace(input, "board.1.0.id", 30), input, "board")
				expectSameRootReferences(replace(input, "settings.theme", "dark"), input, "settings")
			})
		})

		describe("missing values", () => {
			it("creates a missing optional object with only the replaced key", () => {
				const input = createSerializable()
				const result = replace(input, "settings.theme", "dark")

				expect(result.settings).toStrictEqual({ theme: "dark" })
				expect("settings" in input).toBe(false)
			})

			it("appends and adds items beyond the end of arrays", () => {
				const input = createSerializable()

				expect(replace(input, "tags.2", "c").tags).toStrictEqual(["a", "b", "c"])
				expect(replace(input, "order.lines.2", { id: 3, value: "three" }).order.lines).toStrictEqual([
					...input.order.lines,
					{ id: 3, value: "three" },
				])

				const matrix = replace(input, "matrix.3", [5]).matrix
				expect(matrix).toHaveLength(4)
				expect(2 in matrix).toBe(false)
				expect(matrix[3]).toStrictEqual([5])
				expect(input.matrix).toHaveLength(2)
			})

			it("replaces values in empty arrays and empty objects", () => {
				const input = createSerializable()
				input.tags = []
				input.order = { ids: [], lines: [] }
				input.matrix = [[], []]

				expect(replace(input, "tags.0", "a").tags).toStrictEqual(["a"])
				expect(replace(input, "order.ids.0", 1).order).toStrictEqual({ ids: [1], lines: [] })
				expect(replace(input, "matrix.1.0", 3).matrix).toStrictEqual([[], [3]])
				expect(replace(input, "extras.note", "hi").extras).toStrictEqual({ note: "hi" })
				expect(replace(input, "extras.nested.level", 1).extras).toStrictEqual({ nested: { level: 1 } })
				expect(input.extras).toStrictEqual({})
			})

			it("creates a missing row of an array of objects", () => {
				const input = createSerializable()
				const result = replace(input, "order.lines.2.value", "three")

				expect(result.order.lines).toStrictEqual([...input.order.lines, { value: "three" }])
				expect(input.order.lines).toHaveLength(2)
			})
		})

		describe("nested values", () => {
			it("replaces values of mandatory objects", () => {
				const input = createSerializable()
				const result = replace(input, "profile.lastName", "Smith")

				expect(result.profile).toStrictEqual({ firstName: "Jane", lastName: "Smith" })
				expect(replace(input, "profile", { firstName: "John", lastName: "Doe" }).profile).toStrictEqual({
					firstName: "John",
					lastName: "Doe",
				})
			})

			it("replaces values in objects containing other objects at every depth", () => {
				const input = createSerializable()

				expect(replace(input, "company.name", "Acme Corp")).toStrictEqual(
					expected((value) => (value.company.name = "Acme Corp"))
				)
				expect(replace(input, "company.address.city", "Brno")).toStrictEqual(
					expected((value) => (value.company.address.city = "Brno"))
				)
				expect(replace(input, "company.address.geo", { lat: 49.2, lng: 16.6 })).toStrictEqual(
					expected((value) => (value.company.address.geo = { lat: 49.2, lng: 16.6 }))
				)
				expect(replace(input, "company.address.geo.lng", 15)).toStrictEqual(
					expected((value) => (value.company.address.geo.lng = 15))
				)
			})

			it("clones only the containers along the path of a nested object", () => {
				const input = createSerializable()
				const result = replace(input, "company.address.geo.lat", 51)

				expect(result.company).not.toBe(input.company)
				expect(result.company.address).not.toBe(input.company.address)
				expect(result.company.address.geo).not.toBe(input.company.address.geo)
				expect(result.company.address.geo).toStrictEqual({ lat: 51, lng: 14.43 })
				expect(result.company.name).toBe(input.company.name)
				expect(input.company.address.geo.lat).toBe(50.08)
			})

			it("replaces values in objects containing arrays", () => {
				const input = createSerializable()

				expect(replace(input, "order.ids.1", 20)).toStrictEqual(expected((value) => (value.order.ids[1] = 20)))
				expect(replace(input, "order.lines.0.value", "ONE")).toStrictEqual(
					expected((value) => (value.order.lines[0].value = "ONE"))
				)
				expect(replace(input, "order.lines", [])).toStrictEqual(expected((value) => (value.order.lines = [])))

				const result = replace(input, "order.lines.1.id", 20)
				expect(result.order.ids).toBe(input.order.ids)
				expect(result.order.lines[0]).toBe(input.order.lines[0])
				expect(result.order.lines[1]).not.toBe(input.order.lines[1])
			})

			it("replaces every item of primitive arrays", () => {
				const input = createSerializable()
				const result = replace(replace(replace(input, "scores.0", 1), "scores.1", 2), "scores.2", 3)

				expect(result.scores).toStrictEqual([1, 2, 3])
				expect(input.scores).toStrictEqual([10, 20, 30])
			})

			it("replaces values in arrays of arrays with primitive values", () => {
				const input = createSerializable()
				const result = replace(input, "matrix.1.0", 30)

				expect(result.matrix).toStrictEqual([
					[1, 2],
					[30, 4],
				])
				expect(Array.isArray(result.matrix)).toBe(true)
				expect(Array.isArray(result.matrix[1])).toBe(true)
				expect(result.matrix[0]).toBe(input.matrix[0])
				expect(result.matrix[1]).not.toBe(input.matrix[1])

				expect(replace(input, "matrix.0", [9]).matrix).toStrictEqual([[9], [3, 4]])
			})

			it("replaces values in arrays of arrays with objects", () => {
				const input = createSerializable()
				const result = replace(input, "board.1.0.id", 30)

				expect(result).toStrictEqual(expected((value) => (value.board[1][0].id = 30)))
				expect(Array.isArray(result.board)).toBe(true)
				expect(Array.isArray(result.board[1])).toBe(true)
				expect(result.board[0]).toBe(input.board[0])
				expect(result.board[1]).not.toBe(input.board[1])
				expect(result.board[1][0]).not.toBe(input.board[1][0])
				expect(input.board[1][0].id).toBe(3)

				expect(replace(input, "board.0.1", { id: 20, value: "A2" })).toStrictEqual(
					expected((value) => (value.board[0][1] = { id: 20, value: "A2" }))
				)
			})
		})

		describe("recursive values", () => {
			it("replaces files and folders at every level of a recursive folder tree", () => {
				const input = createSerializable()

				expect(replace(input, "root.name", "project")).toStrictEqual(expected((value) => (value.root.name = "project")))
				expect(replace(input, "root.children.1.name", "README.txt")).toStrictEqual(
					expected((value) => (value.root.children[1].name = "README.txt"))
				)
				expect(replace(input, "root.children.0.children.1.children.0.name", "walk.ts")).toStrictEqual(
					expected((value) => (value.root.children[0].children[1].children[0].name = "walk.ts"))
				)

				// utils becomes a file
				expect(replace(input, "root.children.0.children.1.children", [])).toStrictEqual(
					expected((value) => (value.root.children[0].children[1].children = []))
				)

				// README.md becomes a folder
				expect(replace(input, "root.children.1.children.0", { name: "notes.md", children: [] })).toStrictEqual(
					expected((value) => value.root.children[1].children.push({ name: "notes.md", children: [] }))
				)
			})

			it("keeps untouched branches of a recursive folder tree by reference", () => {
				const input = createSerializable()
				const result = replace(input, "root.children.0.children.1.children.0.name", "walk.ts")
				const [src, readme] = input.root.children

				expect(result.root.children[1]).toBe(readme)
				expect(result.root.children[0].children[0]).toBe(src.children[0])
				expect(result.root.children[0]).not.toBe(src)
				expect(result.root.children[0].children[1]).not.toBe(src.children[1])
				expect(src.children[1].children[0].name).toBe("replace.ts")
			})

			it("replaces values deep inside a recursive folder tree", () => {
				const input = createSerializable()
				input.root = createFolderChain(100, "deep.txt")
				const snapshot = structuredClone(input)
				const leafPath = `root${".children.0".repeat(100)}`

				const renamed = looseReplace(input, `${leafPath}.name`, "renamed.txt")
				expect(renamed).toStrictEqual({ ...snapshot, root: createFolderChain(100, "renamed.txt") })
				expect(input).toStrictEqual(snapshot)

				// the deepest file becomes a folder
				const deeper = looseReplace(input, `${leafPath}.children.0`, { name: "child.txt", children: [] })
				let leaf = (deeper as SerializableTest).root
				for (let level = 0; level < 100; level++) leaf = leaf.children[0]
				expect(leaf).toStrictEqual({ name: "deep.txt", children: [{ name: "child.txt", children: [] }] })
				expect(input).toStrictEqual(snapshot)
			})
		})

		describe("references", () => {
			it("does not mutate the input", () => {
				const input = createSerializable()
				const snapshot = structuredClone(input)

				replace(input, "text", "Hi")
				replace(input, "history.0", day(9))
				replace(input, "settings.theme", "dark")
				replace(input, "order.lines.5.value", "six")
				replace(input, "company.address.geo.lat", 0)
				replace(input, "root.children.0.children.1.children.0.name", "walk.ts")
				replace(input, "matrix.1.1", 40)
				replace(input, "board.1.0", { id: 30, value: "B1" })

				expect(input).toStrictEqual(snapshot)
			})

			it("applies many changes at once when calls are chained", () => {
				const input = createSerializable()
				let result = replace(input, "text", "Hi")
				result = replace(result, "tags.1", "B")
				result = replace(result, "history.0", day(5))
				result = replace(result, "settings", { theme: "dark", fontSize: 12 })
				result = replace(result, "order.lines.1.value", "TWO")
				result = replace(result, "company.address.city", "Brno")
				result = replace(result, "root.children.1.name", "README.txt")
				result = replace(result, "matrix.0.1", 20)
				result = replace(result, "board.1.0.id", 30)

				expect(result).toStrictEqual(
					expected((value) => {
						value.text = "Hi"
						value.tags[1] = "B"
						value.history[0] = day(5)
						value.settings = { theme: "dark", fontSize: 12 }
						value.order.lines[1].value = "TWO"
						value.company.address.city = "Brno"
						value.root.children[1].name = "README.txt"
						value.matrix[0][1] = 20
						value.board[1][0].id = 30
					})
				)
				expect(input).toStrictEqual(createSerializable())
				expect(result.profile).toBe(input.profile)
				expect(result.order.ids).toBe(input.order.ids)
				expect(result.root.children[0]).toBe(input.root.children[0])
			})
		})
	})

	describe("fixture with unserializable values", () => {
		it("keeps untouched unserializable values by reference", () => {
			const input = createUnserializable()
			const result = replace(input, "text", "Hi")

			expect(result.text).toBe("Hi")
			expectSameRootReferences(result, input, "text")
			expect(result.position).toBeInstanceOf(Coordinates)
		})

		it("keeps unserializable siblings by reference inside cloned containers", () => {
			const input = createUnserializable()

			const profile = replace(input, "profile.firstName", "John").profile
			expect(profile.firstName).toBe("John")
			expect(profile.getFullName).toBe(input.profile.getFullName)
			expect(profile.labels).toBe(input.profile.labels)

			const order = replace(input, "order.lines.1.value", "TWO").order
			expect(order.lines[1].value).toBe("TWO")
			expect(order.lines[1].onSelect).toBe(input.order.lines[1].onSelect)
			expect(order.lines[0]).toBe(input.order.lines[0])
			expect(order.total).toBe(BigInt(3))

			const board = replace(input, "board.1.0.value", "B1").board
			expect(board[1][0].value).toBe("B1")
			expect(board[1][0].meta).toBe(input.board[1][0].meta)

			const mixed = replace(input, "mixed.0", "A").mixed
			expect(mixed[0]).toBe("A")
			expect(mixed[1]).toBe(input.mixed[1])
			expect(mixed[2]).toBe(input.mixed[2])
		})

		it("replaces unserializable values", () => {
			const input = createUnserializable()
			const format = (value: string) => value.toUpperCase()
			const id = Symbol("other")
			const lookup = new Map([["b", 2]])
			const onSelect = () => undefined

			expect(replace(input, "format", format).format).toBe(format)
			expect(replace(input, "id", id).id).toBe(id)
			expect(replace(input, "big", BigInt(2)).big).toBe(BigInt(2))
			expect(replace(input, "lookup", lookup).lookup).toBe(lookup)
			expect(replace(input, "title", "Title").title).toBe("Title")
			expect(replace(input, "callbacks.0", onSelect).callbacks).toStrictEqual([onSelect, input.callbacks[1]])
			expect(replace(input, "order.lines.0.onSelect", onSelect).order.lines[0].onSelect).toBe(onSelect)
			expect(replace(input, "position", new Coordinates(9, 9)).position).toStrictEqual(new Coordinates(9, 9))
			expect(input.lookup).toStrictEqual(new Map([["a", 1]]))
		})

		it("terminates on circular references and keeps the other branches", () => {
			const input = createUnserializable()
			const result = replace(input, "root.children.1.name", "README.txt")

			expect(result.root.children[1].name).toBe("README.txt")
			expect(result.root.children[0]).toBe(input.root.children[0])
			expect(result.root.children[1].onOpen).toBe(input.root.children[1].onOpen)
			// only the path is cloned, so parent references still point to the original tree
			expect(result.root.children[1].parent).toBe(input.root)
			expect(input.root.children[1].name).toBe("README.md")
		})

		it("replaces values reached through circular references", () => {
			const input = createUnserializable()
			const result = replace(input, "root.children.0.parent.name", "project")

			expect(result.root.name).toBe("root")
			expect(result.root.children[0].parent?.name).toBe("project")
			expect(result.root.children[0].parent?.children).toBe(input.root.children)
			expect(input.root.name).toBe("root")
		})
	})
})
