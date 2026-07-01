import type { FlatObject } from "@/src"

/**
 * Replaces a single deeply nested value, addressed by a dot‑notation path, and
 * returns a new object — the input is left untouched. The `value` type is
 * derived from {@link FlatObject}, so it must match the type at `key`.
 */
export function replace<TObject, TKey extends keyof FlatObject<TObject> & string>(
	object: TObject,
	key: TKey,
	value: FlatObject<TObject>[TKey],
): TObject {
	return setDeep(object, key.split("."), value) as TObject
}

/**
 * Immutably sets `value` at the dot‑notation `path`, cloning every container
 * along the way. Numeric segments create/clone arrays, everything else objects,
 * so a single element or key can be replaced without touching its siblings.
 */
function setDeep(target: unknown, path: string[], value: unknown): unknown {
	const [head, ...rest] = path
	const clone: Record<string, unknown> = Array.isArray(target)
		? ([...(target as unknown[])] as unknown as Record<string, unknown>)
		: { ...(target as Record<string, unknown>) }

	if (rest.length === 0) {
		clone[head] = value
		return clone
	}

	const child = (target as Record<string, unknown> | undefined)?.[head]
	const nextSegmentIsIndex = /^\d+$/.test(rest[0])
	clone[head] = setDeep(child ?? (nextSegmentIsIndex ? [] : {}), rest, value)
	return clone
}
