import type { FlatObject } from "~/types/FlatObject"
import type { PathValue } from "~/types/PathValue"

/**
 * Reads a single deeply nested value, addressed by a dot‑notation path. `key`
 * is constrained to the paths of {@link FlatObject} — both leaf and
 * intermediate (object/array) paths are allowed — and the return type is
 * {@link PathValue}, so it matches the type at `key` exactly.
 */
export function get<TObject, TKey extends keyof FlatObject<TObject> & string>(
	object: TObject,
	key: TKey
): PathValue<TObject, TKey> {
	return getDeep(object, key.split(".")) as PathValue<TObject, TKey>
}

/**
 * Walks `path` segment by segment. Missing containers short‑circuit to
 * `undefined` instead of throwing, which keeps optional paths (and array
 * indices that are out of range) safe to read. Only own properties are read,
 * so a segment never resolves to an inherited value such as `toString`.
 */
function getDeep(target: unknown, path: string[]): unknown {
	return path.reduce<unknown>(
		(current, segment) =>
			current != null && Object.hasOwn(current, segment) ? (current as Record<string, unknown>)[segment] : undefined,
		target
	)
}
