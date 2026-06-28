import { describe, expect, it } from "vitest"
import { isInvalidPrimitive } from "~/merge/isInvalidPrimitive"

describe("isInvalidPrimitive", () => {
	it.each([
		0,
		1,
		"value",
		true,
		false,
		" ",
		-5000,
		Math.PI,
		0.1 + 0.2,
		"true",
		"false",
		["value"],
		[""],
		Number.MAX_VALUE,
		Number.MIN_VALUE,
	])("Value [$0] is NOT invalid", (value) => {
		expect(isInvalidPrimitive(value)).toBeFalsy()
	})
	it.each(["", NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, null, undefined, [], {}])(
		"Value [$0] IS invalid",
		(value) => {
			expect(isInvalidPrimitive(value)).toBeTruthy()
		}
	)
	it.each([
		0,
		1,
		"value",
		true,
		false,
		" ",
		-5000,
		Math.PI,
		0.1 + 0.2,
		"true",
		"false",
		["value"],
		[""],
		Number.MAX_VALUE,
		Number.MIN_VALUE,
		"",
		null,
		undefined,
	])("Value [$0] is NOT invalid with turned on options ", (value) => {
		expect(
			isInvalidPrimitive(value, { emptyStringIsValid: true, undefinedIsValid: true, nullIsValid: true })
		).toBeFalsy()
	})
	it.each([NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, [], {}])(
		"Value [$0] IS invalid with turned on options",
		(value) => {
			expect(
				isInvalidPrimitive(value, { emptyStringIsValid: true, nullIsValid: true, undefinedIsValid: true })
			).toBeTruthy()
		}
	)
	it("Custom validator", () => {
		expect(isInvalidPrimitive("value", { validators: [(v) => v.startsWith("v")] })).toBeTruthy()
	})
})
