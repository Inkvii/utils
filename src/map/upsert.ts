/**
 * Upserts existing map by `value`, following the `fn` behavior
 * @param map existing map
 * @param key key to be upserted
 * @param value value to be upserted
 * @param fn function used when value exists in the map
 * @example ```tsx
 *   const map = new Map<string, string[]>()
 *   map.set("a", ["1", "2"])
 *   upsert(map, "a", ["3"], (prev, value) => [...prev, ...value])
 *   // output: ["1", "2", "3"]
 * ```
 * @remarks if key does not exist, sets the value
 */
export function upsert<TKey, TValue>(
	map: Map<TKey, TValue>,
	key: TKey,
	value: TValue,
	fn: (prev: TValue, value: TValue) => TValue
) {
	if (map.has(key)) {
		const prev = map.get(key) as TValue
		const next = fn(prev, value)

		map.set(key, next)
		return next
	}

	map.set(key, value)
	return value
}
