import { describe, expectTypeOf, it } from "vitest"
import { isEmptyArray, isEmptyObject } from "~/guard/utils"

describe("isEmptyArray", () => {
	it("keeps the array type in the false branch", () => {
		const items = [] as string[]
		if (isEmptyArray(items)) {
			expectTypeOf(items).toEqualTypeOf<string[] & { length: 0 }>()
			items.push("default")
			return
		}
		expectTypeOf(items).toEqualTypeOf<string[]>()
	})

	it("narrows only the array members of a union", () => {
		const value = [] as readonly string[] | string | undefined
		if (isEmptyArray(value)) {
			expectTypeOf(value).toEqualTypeOf<readonly string[] & { length: 0 }>()
			return
		}
		expectTypeOf(value).toEqualTypeOf<readonly string[] | string | undefined>()
	})

	it("narrows unknown to an empty array", () => {
		const value = [] as unknown
		if (isEmptyArray(value)) {
			expectTypeOf(value).toEqualTypeOf<unknown[] & { length: 0 }>()
		}
	})
})

describe("isEmptyObject", () => {
	interface Form {
		name?: string
	}

	it("keeps objects in the false branch", () => {
		const value = { x: 1 } as { x: number } | string
		if (!isEmptyObject(value)) {
			expectTypeOf(value).toEqualTypeOf<{ x: number } | string>()
		}
		const form = {} as Form
		if (!isEmptyObject(form)) {
			expectTypeOf(form).toEqualTypeOf<Form>()
		}
	})

	it("narrows unknown to an object without keys", () => {
		const value = {} as unknown
		if (isEmptyObject(value)) {
			expectTypeOf(value).toEqualTypeOf<Record<string, never>>()
		}
	})
})
