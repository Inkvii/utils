/**
 * Creates array out of single element input
 * @param value value to become `[value]`
 * @example tuplify("1") // -> ["1"]
 * @example tuplify(["1","2"]) // -> ["1", "2"]
 * @example tuplify([]) // -> []
 * @example tuplify("") // -> [""]
 */
export function tuplify<TData>(value: TData | TData[]) {
	if (Array.isArray(value)) return value
	return [value]
}
