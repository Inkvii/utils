import type { IsOpaque } from "~/types/IsOpaque"

/**
 * Resolves the type of the value at the dot‑notation path `TPath` by splitting
 * it on `.` and walking `T` one segment at a time. Unlike indexing
 * {@link FlatObject}, this stays exact for records: in `FlatObject` the
 * `` `byId.${string}` `` key also matches `"byId.1.value"`, so the lookup
 * collapses to the record value (or an intersection), while `PathValue` walks
 * `byId` → `1` → `value`.
 *
 * - Optional keys resolve to their type without `undefined`, same as {@link FlatObject}.
 * - Array elements are addressed by integer segments (`${bigint}`).
 * - Numeric segments also address numeric keys (`Record<number, T>`, `{ 1: T }`).
 * - Unknown segments, segments below a primitive, opaque types (`object`, `unknown`, `any`) and a non‑literal
 *   `string` path resolve to `unknown`.
 *
 * @typeParam T - The object type to walk.
 * @typeParam TPath - A dot‑notation path into `T`.
 *
 * @example
 * ```tsx
 * type Example = {
 *   byId: Record<string, { id: number; tags: string[] }>;
 *   settings?: { theme: string };
 * };
 *
 * type A = PathValue<Example, "byId.1">; // { id: number; tags: string[] }
 * type B = PathValue<Example, "byId.1.tags.0">; // string
 * type C = PathValue<Example, "settings.theme">; // string
 * type D = PathValue<Example, "nope">; // unknown
 * ```
 */
export type PathValue<T, TPath extends string> = string extends TPath
	? unknown
	: TPath extends `${infer THead}.${infer TRest}`
		? PathValue<SegmentValue<T, THead>, TRest>
		: SegmentValue<T, TPath>

/** Type of the value at a single path segment of `T` */
type SegmentValue<T, TSegment extends string> =
	IsOpaque<T> extends true
		? unknown
		: T extends readonly (infer TElement)[]
			? TSegment extends `${bigint}`
				? TElement
				: unknown
			: T extends object
				? KeyValue<Required<T>, TSegment>
				: unknown

/** Numeric segments fall back to numeric keys, which `keyof` reports as numbers */
type KeyValue<T, TSegment extends string> = TSegment extends keyof T
	? T[TSegment]
	: TSegment extends `${infer TIndex extends number}`
		? TIndex extends keyof T
			? T[TIndex]
			: unknown
		: unknown
