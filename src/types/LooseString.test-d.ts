import { assertType, describe, it } from "vitest"
import type { LooseString } from "~/types"

type Theme = "dark" | "light"

describe("LooseString", () => {
	it("accepts the known literal members", () => {
		assertType<LooseString<Theme>>("dark")
		assertType<LooseString<Theme>>("light")
	})

	it("accepts arbitrary strings outside the union", () => {
		assertType<LooseString<Theme>>("system")
		assertType<LooseString<Theme>>("")
		const dynamic: string = "whatever"
		assertType<LooseString<Theme>>(dynamic)
	})

	it("rejects non-string values", () => {
		// @ts-expect-error numbers are not assignable
		assertType<LooseString<Theme>>(1)
		// @ts-expect-error booleans are not assignable
		assertType<LooseString<Theme>>(true)
		// @ts-expect-error null is not assignable
		assertType<LooseString<Theme>>(null)
	})

	it("stays assignable to string", () => {
		const value: LooseString<Theme> = "dark"
		assertType<string>(value)
	})
})
