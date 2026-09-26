import { assertType, describe, expectTypeOf, it } from "vitest"
import type { FlatObject } from "~/types"

type Test = {
	a: string
	d: string[]
	matrix: number[][]
	cube: boolean[][][]
	items: { id: string; tags: string[] }[]
	readonlyItems: readonly { flag: boolean }[]
	nested: {
		deep: { here: boolean }
	}
}

type Flat = FlatObject<Test>
type Path = keyof Flat

describe("FlatObject", () => {
	it("maps plain object paths to their value types", () => {
		expectTypeOf<Flat["a"]>().toEqualTypeOf<string>()
		expectTypeOf<Flat["nested"]>().toEqualTypeOf<{ deep: { here: boolean } }>()
		expectTypeOf<Flat["nested.deep"]>().toEqualTypeOf<{ here: boolean }>()
		expectTypeOf<Flat["nested.deep.here"]>().toEqualTypeOf<boolean>()
	})

	it("maps array paths to the array and its element", () => {
		expectTypeOf<Flat["d"]>().toEqualTypeOf<string[]>()
		expectTypeOf<Flat["d.0"]>().toEqualTypeOf<string>()
		expectTypeOf<Flat["items.0"]>().toEqualTypeOf<{ id: string; tags: string[] }>()
		expectTypeOf<Flat["items.0.id"]>().toEqualTypeOf<string>()
		expectTypeOf<Flat["readonlyItems.0.flag"]>().toEqualTypeOf<boolean>()
	})

	it("resolves arrays nested in array elements", () => {
		expectTypeOf<Flat["items.0.tags"]>().toEqualTypeOf<string[]>()
		expectTypeOf<Flat["items.0.tags.1"]>().toEqualTypeOf<string>()
	})

	// `${number}` also matches strings such as "0.1", so an index into a nested
	// array can be matched by the shallower `${number}` key as well. The lookup
	// must resolve to the deeper element type only, never an intersection.
	describe("nested arrays do not collide on `${number}`", () => {
		it("resolves each depth of a 2D array to its own type", () => {
			expectTypeOf<Flat["matrix"]>().toEqualTypeOf<number[][]>()
			expectTypeOf<Flat["matrix.0"]>().toEqualTypeOf<number[]>()
			expectTypeOf<Flat["matrix.0.1"]>().toEqualTypeOf<number>()
			expectTypeOf<Flat["matrix.10.25"]>().toEqualTypeOf<number>()
		})

		it("resolves each depth of a 3D array to its own type", () => {
			expectTypeOf<Flat["cube.0"]>().toEqualTypeOf<boolean[][]>()
			expectTypeOf<Flat["cube.0.1"]>().toEqualTypeOf<boolean[]>()
			expectTypeOf<Flat["cube.0.1.2"]>().toEqualTypeOf<boolean>()
		})
	})

	// A runtime array index is an integer. Other numeric strings never address
	// an element (`arr["1.5"]` is `undefined`), so they must not be valid paths.
	// Known limitation: negative ("-1") and hex ("0x1") segments still match
	// `${bigint}` and are accepted.
	describe("only integer segments address array elements", () => {
		it("rejects fractional indices", () => {
			// @ts-expect-error "1.5" is not an array index
			assertType<Path>("d.1.5")
			// @ts-expect-error "1.5" is not an array index
			assertType<Path>("items.1.5")
			// @ts-expect-error "1.5" is not an array index
			assertType<Path>("items.1.5.id")
		})

		it("rejects non-decimal numeric notations", () => {
			// @ts-expect-error exponent notation is not an array index
			assertType<Path>("d.1e3")
			// @ts-expect-error padded numbers are not array indices
			assertType<Path>("d. 1")
			// @ts-expect-error leading zeros are not array indices
			assertType<Path>("d.01")
		})

		it("rejects numeric-like but non-finite values", () => {
			// @ts-expect-error NaN is not an array index
			assertType<Path>("d.NaN")
			// @ts-expect-error Infinity is not an array index
			assertType<Path>("d.Infinity")
		})

		it("rejects a numeric segment on a non-array", () => {
			// @ts-expect-error "a" is a string, not an array
			assertType<Path>("a.0")
			// @ts-expect-error "nested" is an object, not an array
			assertType<Path>("nested.0")
		})
	})

	// Types without statically known keys cannot be flattened, so any string is
	// a valid path and the value is `unknown` — never an empty (`never`) key set.
	describe("opaque types fall back to string paths", () => {
		it("accepts any string key for types without known keys", () => {
			expectTypeOf<keyof FlatObject<object>>().toEqualTypeOf<string>()
			// eslint-disable-next-line @typescript-eslint/no-empty-object-type
			expectTypeOf<keyof FlatObject<{}>>().toEqualTypeOf<string>()
			expectTypeOf<keyof FlatObject<unknown>>().toEqualTypeOf<string>()
			expectTypeOf<keyof FlatObject<Record<string, unknown>>>().toEqualTypeOf<string>()
		})

		it("treats any as opaque instead of an array", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expectTypeOf<keyof FlatObject<any>>().toEqualTypeOf<string>()
		})

		it("resolves an opaque path to unknown", () => {
			expectTypeOf<FlatObject<object>["anything.at.all"]>().toEqualTypeOf<unknown>()
		})

		it("falls back only below an opaque nested field", () => {
			type WithMeta = { a: string; meta: object }

			expectTypeOf<FlatObject<WithMeta>["a"]>().toEqualTypeOf<string>()
			expectTypeOf<FlatObject<WithMeta>["meta"]>().toEqualTypeOf<object>()
			expectTypeOf<FlatObject<WithMeta>["meta.x"]>().toEqualTypeOf<unknown>()
			// @ts-expect-error known levels still reject unknown keys
			assertType<keyof FlatObject<WithMeta>>("nope")
		})

		it("keeps an array of opaque elements index-only", () => {
			expectTypeOf<FlatObject<object[]>["0"]>().toEqualTypeOf<object>()
			// @ts-expect-error "x" is not an array index
			assertType<keyof FlatObject<object[]>>("x")
		})
	})
})
