import type { FlatObject } from "~/types/FlatObject"

/**
 * Reads a single deeply nested value, addressed by a dot‑notation path. The
 * return type is derived from {@link FlatObject}, so it matches the type at
 * `key` exactly — both leaf and intermediate (object/array) paths are allowed.
 */
export function get<TObject, TKey extends keyof FlatObject<TObject> & string>(
	object: TObject,
	key: TKey
): FlatObject<TObject>[TKey] {
	return getDeep(object, key.split(".")) as FlatObject<TObject>[TKey]
}

/**
 * Walks `path` segment by segment. Missing containers short‑circuit to
 * `undefined` instead of throwing, which keeps optional paths (and array
 * indices that are out of range) safe to read.
 */
function getDeep(target: unknown, path: string[]): unknown {
	return path.reduce<unknown>((current, segment) => (current as Record<string, unknown> | undefined)?.[segment], target)
}
