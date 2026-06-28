export function isPlainObject(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v)
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

/**
 * Creates array out of single element input
 * @param value value to become `[value]`
 * @example tuplify("1") // -> ["1"]
 * @example tuplify(["1","2"]) // -> ["1", "2"]
 * @example tuplify([]) // -> []
 * @example tuplify("") // -> []
 */
export function tuplify<TData>(value: TData | TData[]) {
	if (Array.isArray(value)) return value
	return [value]
}
