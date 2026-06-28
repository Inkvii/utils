import { isEmptyArray, isEmptyObject, isInvalidNumber } from "~/merge/utils"

export type IsInvalidPrimitiveOptions<TValue> = {
	/**
	 * If `true` - `null` values will not be marked for removal
	 */
	nullIsValid?: boolean
	/**
	 * If `true` - `undefined` values will not be marked for removal
	 */
	undefinedIsValid?: boolean
	/**
	 * If `true` - empty string `""` values will not be marked for removal
	 */
	emptyStringIsValid?: boolean
	/**
	 * Array of custom validators that are evaluated before baked in validators. Can be used e.g. for removal enum values from string array.
	 *
	 * @remarks Validator that returns `true` marks `value` for removal
	 * @example ```tsx
	 * validators: [
	 *   (value: string) => ["A", "B", "C"].includes(value)
	 * ]
	 * ```
	 */
	validators?: ((value: TValue) => boolean)[]
}

export function isInvalidPrimitive<TValue>(value: TValue, options?: IsInvalidPrimitiveOptions<TValue>): boolean {
	if (options?.validators) {
		const customValidatorResult = options.validators?.some((validator) => validator(value))
		if (customValidatorResult) return true
	}
	if (value === null) return !options?.nullIsValid
	if (value === undefined) return !options?.undefinedIsValid
	if (typeof value === "string" && value === "") return !options?.emptyStringIsValid
	if (isEmptyArray(value)) return true
	if (isEmptyObject(value)) return true
	return isInvalidNumber(value)
}
