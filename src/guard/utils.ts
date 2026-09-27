/**
 * Only object literals and `Object.create(null)` pass, so arrays, `Date`, `Map`, `Set` or class instances do not.
 */
export function isPlainObject(v: unknown): v is Record<string, unknown> {
	if (typeof v !== "object" || v === null) return false
	const prototype: unknown = Object.getPrototypeOf(v)
	return prototype === Object.prototype || prototype === null
}

/**
 * Narrows to an object without keys. Objects with required keys are kept in the `false` branch.
 * @example ```tsx
 * if (!isEmptyObject(form)) form.name // form is still typed as the form
 * ```
 */
export function isEmptyObject(v: unknown): v is Record<string, never> {
	if (!isPlainObject(v)) return false
	return Object.keys(v).length === 0
}

/**
 * Narrows to the array members of `v` with `length: 0`. Arrays are kept in the `false` branch, since a non‑empty array
 * has the same type.
 * @example ```tsx
 * if (isEmptyArray(items)) return <Empty />
 * items.map(...) // items is still string[]
 * ```
 */
export function isEmptyArray<T>(
	v: T
): v is unknown extends T ? T & unknown[] & { length: 0 } : Extract<T, readonly unknown[]> & { length: 0 } {
	return Array.isArray(v) && v.length === 0
}

export function isInvalidNumber(v: unknown): boolean {
	return typeof v === "number" && (!Number.isFinite(v) || Number.isNaN(v))
}
