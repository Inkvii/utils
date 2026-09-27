/**
 * Only object literals and `Object.create(null)` pass, so arrays, `Date`, `Map`, `Set` or class instances do not.
 */
export function isPlainObject(v: unknown): v is Record<string, unknown> {
	if (typeof v !== "object" || v === null) return false
	const prototype: unknown = Object.getPrototypeOf(v)
	return prototype === Object.prototype || prototype === null
}

export function isEmptyObject(v: unknown): v is object {
	if (!isPlainObject(v)) return false
	return Object.keys(v).length === 0
}

export function isEmptyArray(v: unknown): v is Array<unknown> {
	return Array.isArray(v) && v.length === 0
}

export function isInvalidNumber(v: unknown): boolean {
	return typeof v === "number" && (!Number.isFinite(v) || Number.isNaN(v))
}
