import { describe, expect, it } from "vitest"
import { get } from "~/object/get"

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
const looseGet = get as (object: unknown, key: string) => unknown

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
		// │       └── get.ts
		// └── README.md
		root: {
			name: "root",
			children: [
				{
					name: "src",
					children: [
						{ name: "index.ts", children: [] },
						{ name: "utils", children: [{ name: "get.ts", children: [] }] },
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

describe("get", () => {
	describe("paths", () => {
		it("reads a top-level primitive", () => {
			expect(get(createObject(), "a")).toBe("Hello")
			expect(get(createObject(), "b")).toBe(12)
			expect(get(createObject(), "c")).toBe(false)
		})

		it("reads a nested value", () => {
			expect(get(createObject(), "nested.value")).toBe("Hey there")
			expect(get(createObject(), "nested.deep.here")).toBe(true)
		})

		it("reads a single array element field by index", () => {
			expect(get(createObject(), "nested.arr.0.key")).toBe("an")
			expect(get(createObject(), "nested.arr.1.value")).toBe("No")
		})

		it("reads a whole array element", () => {
			expect(get(createObject(), "nested.arr.0")).toStrictEqual({ key: "an", value: "ANO" })
		})

		it("reads a primitive array element", () => {
			expect(get(createObject(), "d.1")).toBe("second")
		})

		it("reads a whole nested object", () => {
			expect(get(createObject(), "nested.deep")).toStrictEqual({ here: true })
			expect(get(createObject(), "d")).toStrictEqual(["first", "second"])
		})
	})

	describe("keys", () => {
		it("reads numeric-looking keys of plain objects", () => {
			const input: { byId: Record<string, Row> } = { byId: { "1": { id: 1, value: "one" } } }

			expect(get(input, "byId.1")).toStrictEqual({ id: 1, value: "one" })
			expect(get(input, "byId.1.value")).toBe("one")
		})

		it("reads from an array root", () => {
			const input: Row[] = [
				{ id: 1, value: "one" },
				{ id: 2, value: "two" },
			]

			expect(get(input, "1")).toBe(input[1])
			expect(get(input, "1.value")).toBe("two")
		})

		it("reads own keys named like Object.prototype members", () => {
			const input = { constructor: { name: "custom" }, toString: "text" }

			expect(get(input, "constructor.name")).toBe("custom")
			expect(get(input, "toString")).toBe("text")
		})

		it("does not resolve missing keys to inherited values", () => {
			const input = createSerializable()

			expect(looseGet({}, "toString")).toBeUndefined()
			expect(looseGet(input, "constructor")).toBeUndefined()
			expect(looseGet(input, "__proto__")).toBeUndefined()
			expect(looseGet(input, "profile.hasOwnProperty")).toBeUndefined()
			expect(looseGet(input, "tags.map")).toBeUndefined()
			expect(looseGet(input, "createdAt.getTime")).toBeUndefined()
			expect(looseGet(input, "text.toUpperCase")).toBeUndefined()
			expect(looseGet(createUnserializable(), "lookup.size")).toBeUndefined()
		})

		it("reads own properties of arrays and strings", () => {
			const input = createSerializable()

			expect(looseGet(input, "tags.length")).toBe(2)
			expect(looseGet(input, "text.length")).toBe(5)
			expect(looseGet(input, "text.0")).toBe("H")
		})

		it("reads objects created with Object.create(null)", () => {
			const inner = Object.assign(Object.create(null) as object, { value: 1 })
			const input = Object.assign(Object.create(null) as object, { inner })

			expect(looseGet(input, "inner")).toBe(inner)
			expect(looseGet(input, "inner.value")).toBe(1)
			expect(looseGet(input, "inner.missing")).toBeUndefined()
		})
	})

	describe("missing values", () => {
		it("returns undefined for a missing array index instead of throwing", () => {
			expect(get(createObject(), "nested.arr.99.key")).toBeUndefined()
		})

		it("returns undefined when the root is null or undefined", () => {
			expect(looseGet(undefined, "a")).toBeUndefined()
			expect(looseGet(null, "a")).toBeUndefined()
			expect(looseGet(undefined, "a.b.0.c")).toBeUndefined()
		})

		it("returns undefined when a container along the path is null", () => {
			const input: { manager: { name: string } | null } = { manager: null }

			expect(get(input, "manager")).toBeNull()
			expect(looseGet(input, "manager.name")).toBeUndefined()
			expect(looseGet(input, "manager.name.first")).toBeUndefined()
		})

		it("returns undefined when a primitive leaf is walked past", () => {
			const input = createSerializable()

			expect(looseGet(input, "count.value")).toBeUndefined()
			expect(looseGet(input, "flag.value")).toBeUndefined()
			expect(looseGet(input, "nullable.value")).toBeUndefined()
			expect(looseGet(input, "maybe.value")).toBeUndefined()
		})
	})

	describe("references", () => {
		it("returns the same reference as the source", () => {
			const original = createObject()
			expect(get(original, "nested.arr")).toBe(original.nested.arr)
			expect(get(original, "nested.arr.0")).toBe(original.nested.arr[0])
		})

		it("does not mutate the input", () => {
			const original = createObject()
			get(original, "nested.arr.0.key")

			expect(original).toStrictEqual(createObject())
		})
	})

	describe("serializable fixture", () => {
		describe("root values", () => {
			it("reads primitives, null, undefined and NaN at the root", () => {
				const input = createSerializable()

				expect(get(input, "text")).toBe("Hello")
				expect(get(input, "count")).toBe(0)
				expect(get(input, "flag")).toBe(false)
				expect(get(input, "nullable")).toBeNull()
				expect(get(input, "maybe")).toBeUndefined()

				input.count = NaN
				expect(get(input, "count")).toBeNaN()
			})

			it("reads filled in optional values", () => {
				const input = createSerializable()
				input.optional = 0
				input.nullable = "set"
				input.maybe = "defined"
				input.settings = { theme: "dark", fontSize: 12 }

				expect(get(input, "optional")).toBe(0)
				expect(get(input, "nullable")).toBe("set")
				expect(get(input, "maybe")).toBe("defined")
				expect(get(input, "settings")).toBe(input.settings)
				expect(get(input, "settings.fontSize")).toBe(12)
			})

			it("reads dates by reference, as values and inside arrays", () => {
				const input = createSerializable()
				input.deletedAt = day(10)

				expect(get(input, "createdAt")).toBe(input.createdAt)
				expect(get(input, "deletedAt")).toBe(input.deletedAt)
				expect(get(input, "history")).toBe(input.history)
				expect(get(input, "history.1")).toBe(input.history[1])
				expect(get(input, "history.1")).toStrictEqual(day(3))
			})
		})

		describe("missing values", () => {
			it("returns undefined for missing optional keys and paths through them", () => {
				const input = createSerializable()

				expect(get(input, "optional")).toBeUndefined()
				expect(get(input, "settings")).toBeUndefined()
				expect(get(input, "settings.theme")).toBeUndefined()
				expect(get(input, "settings.fontSize")).toBeUndefined()
			})

			it("returns undefined for out-of-range indices at every depth", () => {
				const input = createSerializable()

				expect(get(input, "tags.2")).toBeUndefined()
				expect(get(input, "history.5")).toBeUndefined()
				expect(get(input, "order.lines.2")).toBeUndefined()
				expect(get(input, "order.lines.2.value")).toBeUndefined()
				expect(get(input, "matrix.0.2")).toBeUndefined()
				expect(get(input, "matrix.5.0")).toBeUndefined()
				expect(get(input, "board.1.1.value")).toBeUndefined()
				expect(get(input, "root.children.2.name")).toBeUndefined()
			})

			it("returns undefined for paths into empty arrays and empty objects", () => {
				const input = createSerializable()
				input.tags = []
				input.order = { ids: [], lines: [] }
				input.matrix = [[], []]

				expect(get(input, "tags.0")).toBeUndefined()
				expect(get(input, "order.lines.0.id")).toBeUndefined()
				expect(get(input, "matrix.1.0")).toBeUndefined()
				expect(get(input, "extras.note")).toBeUndefined()
				expect(get(input, "extras.nested.level")).toBeUndefined()
			})

			it("reads keys of loosely typed records", () => {
				const input = createSerializable()
				input.extras = { note: "hi", nested: { level: 1 }, list: [1, 2] }

				expect(get(input, "extras.note")).toBe("hi")
				expect(get(input, "extras.nested")).toBe(input.extras.nested)
				expect(get(input, "extras.nested.level")).toBe(1)
				expect(get(input, "extras.list.1")).toBe(2)
			})
		})

		describe("nested values", () => {
			it("reads values of mandatory objects", () => {
				const input = createSerializable()

				expect(get(input, "profile")).toBe(input.profile)
				expect(get(input, "profile.firstName")).toBe("Jane")
				expect(get(input, "profile.lastName")).toBe("Doe")
			})

			it("reads values in objects containing other objects at every depth", () => {
				const input = createSerializable()

				expect(get(input, "company")).toBe(input.company)
				expect(get(input, "company.name")).toBe("Acme")
				expect(get(input, "company.address")).toBe(input.company.address)
				expect(get(input, "company.address.city")).toBe("Prague")
				expect(get(input, "company.address.geo")).toStrictEqual({ lat: 50.08, lng: 14.43 })
				expect(get(input, "company.address.geo.lat")).toBe(50.08)
				expect(get(input, "company.address.geo.lng")).toBe(14.43)
			})

			it("reads values in objects containing arrays", () => {
				const input = createSerializable()

				expect(get(input, "order.ids")).toBe(input.order.ids)
				expect(get(input, "order.ids.1")).toBe(2)
				expect(get(input, "order.lines")).toBe(input.order.lines)
				expect(get(input, "order.lines.1")).toBe(input.order.lines[1])
				expect(get(input, "order.lines.1.id")).toBe(2)
				expect(get(input, "order.lines.0.value")).toBe("one")
			})

			it("reads every item of primitive arrays", () => {
				const input = createSerializable()

				expect(input.scores.map((_, index) => looseGet(input, `scores.${index}`))).toStrictEqual([10, 20, 30])
				expect(input.tags.map((_, index) => looseGet(input, `tags.${index}`))).toStrictEqual(["a", "b"])
			})

			it("reads values in arrays of arrays with primitive values", () => {
				const input = createSerializable()

				expect(get(input, "matrix")).toBe(input.matrix)
				expect(get(input, "matrix.1")).toBe(input.matrix[1])
				expect(get(input, "matrix.0.1")).toBe(2)
				expect(get(input, "matrix.1.0")).toBe(3)
			})

			it("reads values in arrays of arrays with objects", () => {
				const input = createSerializable()

				expect(get(input, "board.0")).toBe(input.board[0])
				expect(get(input, "board.0.1")).toBe(input.board[0][1])
				expect(get(input, "board.0.1.value")).toBe("a2")
				expect(get(input, "board.1.0.id")).toBe(3)
			})
		})

		describe("recursive values", () => {
			it("reads files and folders at every level of a recursive folder tree", () => {
				const input = createSerializable()

				expect(get(input, "root.name")).toBe("root")
				expect(get(input, "root.children.0.name")).toBe("src")
				expect(get(input, "root.children.1")).toStrictEqual({ name: "README.md", children: [] })
				expect(get(input, "root.children.0.children.0.name")).toBe("index.ts")
				expect(get(input, "root.children.0.children.1.children")).toBe(input.root.children[0].children[1].children)
				expect(get(input, "root.children.0.children.1.children.0.name")).toBe("get.ts")
				expect(get(input, "root.children.0.children.1.children.0.children")).toStrictEqual([])
				expect(get(input, "root.children.0.children.1.children.1.name")).toBeUndefined()
			})

			it("reads values deep inside a recursive folder tree", () => {
				const input = createSerializable()
				input.root = createFolderChain(100, "deep.txt")
				const leafPath = `root${".children.0".repeat(100)}`

				expect(looseGet(input, `${leafPath}.name`)).toBe("deep.txt")
				expect(looseGet(input, `${leafPath}.children`)).toStrictEqual([])
				expect(looseGet(input, `${leafPath}.children.0.name`)).toBeUndefined()
				expect(looseGet(input, `root${".children.0".repeat(50)}.name`)).toBe("level-50")
			})
		})

		describe("references", () => {
			it("does not mutate the input and does not add missing keys", () => {
				const input = createSerializable()
				const snapshot = structuredClone(input)

				get(input, "company.address.geo.lat")
				get(input, "order.lines.5.value")
				get(input, "settings.theme")
				get(input, "root.children.0.children.1.children.0.name")

				expect(input).toStrictEqual(snapshot)
				expect("settings" in input).toBe(false)
				expect(input.order.lines).toHaveLength(2)
			})

			it("reads the same value from separately created copies", () => {
				const paths = [
					"text",
					"tags.1",
					"history.0",
					"company.address.geo",
					"order.lines.1",
					"root.children.0.children.1",
					"matrix.1",
					"board.0.1.value",
				] as const

				for (const path of paths) {
					expect(get(createSerializable(), path)).toStrictEqual(get(createSerializable(), path))
				}
			})
		})
	})

	describe("fixture with unserializable values", () => {
		it("returns unserializable values at the root by reference", () => {
			const input = createUnserializable()

			expect(get(input, "format")).toBe(input.format)
			expect(get(input, "id")).toBe(input.id)
			expect(get(input, "big")).toBe(BigInt(1))
			expect(get(input, "lookup")).toBe(input.lookup)
			expect(get(input, "unique")).toBe(input.unique)
			expect(get(input, "pattern")).toBe(input.pattern)
			expect(get(input, "position")).toBe(input.position)
			expect(get(input, "position")).toBeInstanceOf(Coordinates)
			expect(get(input, "title")).toBe(input.title)
			expect(get(input, "onClose")).toBeUndefined()
		})

		it("reads unserializable values nested in objects and arrays", () => {
			const input = createUnserializable()

			expect(get(input, "callbacks.1")).toBe(input.callbacks[1])
			expect(get(input, "mixed.0")).toBe("a")
			expect(get(input, "mixed.1")).toBe(input.mixed[1])
			expect(get(input, "mixed.2")).toBe(input.mixed[2])
			expect(get(input, "profile.getFullName")).toBe(input.profile.getFullName)
			expect(get(input, "profile.labels")).toBe(input.profile.labels)
			expect(get(input, "order.total")).toBe(BigInt(3))
			expect(get(input, "order.lines.0.onSelect")).toBe(input.order.lines[0].onSelect)
			expect(get(input, "board.1.0.meta")).toBe(input.board[1][0].meta)
			expect(get(input, "root.children.0.onOpen")).toBe(input.root.children[0].onOpen)
		})

		it("reads serializable values next to unserializable values", () => {
			const input = createUnserializable()

			expect(get(input, "text")).toBe("Hello")
			expect(get(input, "profile.firstName")).toBe("Jane")
			expect(get(input, "order.lines.1.value")).toBe("two")
			expect(get(input, "board.0.1.id")).toBe(2)
			expect(get(input, "root.children.0.children.1.children.0.name")).toBe("get.ts")
		})

		it("reads fields of class instances", () => {
			const input = createUnserializable()

			expect(get(input, "position.x")).toBe(1)
			expect(get(input, "position.y")).toBe(2)
		})

		it("does not read Map and Set entries as properties", () => {
			const input = createUnserializable()

			expect(looseGet(input, "lookup.a")).toBeUndefined()
			expect(looseGet(input, "unique.a")).toBeUndefined()
			expect(looseGet(input, "board.1.0.meta.color")).toBeUndefined()
		})

		it("follows circular references", () => {
			const input = createUnserializable()
			const src = input.root.children[0]

			expect(get(input, "root.children.0.parent")).toBe(input.root)
			expect(get(input, "root.children.0.children.1.parent")).toBe(src)
			expect(looseGet(input, "root.children.0.children.1.parent.parent.name")).toBe("root")
			expect(looseGet(input, `root${".children.0.parent".repeat(50)}.name`)).toBe("root")
			expect(get(input, "root.parent")).toBeUndefined()
		})
	})
})
