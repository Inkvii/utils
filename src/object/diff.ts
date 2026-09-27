import type { ArrayDiffHandler } from "~/array/diffByIndex"
import type { DeepPartial } from "~/types/DeepPartial"
import type { FlatObject } from "~/types/FlatObject"
import type { IsOpaque } from "~/types/IsOpaque"
import type { IsPlainObject } from "~/types/IsPlainObject"
import { toPath, walkDiff, type DiffSink, type PathSegment } from "~/object/walkDiff"

/**
 * A single difference found by {@link diff}.
 */
export interface DiffEntry<TValue = unknown> {
	/** Dot‑notation path of the value, e.g. `"nested.arr.3.value"`. Same as the key in `output: "flat"` */
	path: string
	/** Value from the input object. `undefined` if the key is missing in the input */
	inputValue: TValue | undefined
	/** Value from the initial object. `undefined` if the key is missing in the initial object */
	initialValue: TValue | undefined
}

export interface DiffOptions {
	/**
	 * Shape of the result
	 * - `"nested"` (default) - mirrors the structure of the input, e.g. `result.nested.arr[3].value`
	 * - `"flat"` - single level object keyed by dot‑notation path, e.g. `result["nested.arr.3.value"]`
	 */
	output?: "nested" | "flat"
	/**
	 * Decides which array items are compared against each other.
	 * Defaults to `arrayUtils.diffByIndex` - items are paired by their index.
	 * @example ```tsx
	 * // pair rows by id, so inserting a row does not shift the rest
	 * onArrayDiff: (inputArray, initialArray) => ...
	 * ```
	 */
	onArrayDiff?: ArrayDiffHandler
	/**
	 * Replaces the default leaf comparator ({@link isEqualLeaf}). Called only for leaf values (primitives, `null`,
	 * `undefined`, `Date`). Structural mismatches (e.g. object vs primitive) are always reported.
	 * @example ```tsx
	 * isEqual: (inputValue, initialValue, path) =>
	 *   path === "name" ? String(inputValue).trim() === String(initialValue).trim() : isEqualLeaf(inputValue, initialValue)
	 * ```
	 */
	isEqual?: (inputValue: unknown, initialValue: unknown, path: string) => boolean
	/**
	 * Returning `true` skips the value at `path` together with its whole subtree
	 * @example ```tsx
	 * ignore: (path) => path === "updatedAt" || path.startsWith("meta.")
	 * ```
	 */
	ignore?: (path: string) => boolean
}

/**
 * Result of {@link diff} with `output: "flat"`. Keys are dot‑notation paths of {@link FlatObject}, so paths deeper
 * than `TDepth` nested objects/arrays are typed loosely as `DiffEntry<unknown>`.
 */
export type DiffFlat<T, TDepth extends number = 5> = {
	[TKey in keyof FlatObject<T, TDepth> & string]?: DiffEntry<FlatObject<T, TDepth>[TKey]>
}

/**
 * Result of {@link diff} with `output: "nested"`. Mirrors the structure of `T`; every node is either a nested
 * object/array (when the difference is deeper) or a {@link DiffEntry}.
 */
export type DiffNested<T> =
	IsOpaque<T> extends true
		? Record<string, unknown>
		: T extends readonly (infer TElement)[]
			? Array<DiffNode<TElement>>
			: { [TKey in keyof T]?: DiffNode<T[TKey]> }

type DiffNode<TValue> = DiffEntry<TValue> | DiffNestedChild<NonNullable<TValue>>

type DiffNestedChild<TValue> = TValue extends Date
	? never
	: TValue extends readonly unknown[]
		? DiffNested<TValue>
		: IsPlainObject<TValue> extends true
			? DiffNested<TValue>
			: never

/**
 * Narrows a node of a nested {@link diff} result to a {@link DiffEntry} (as opposed to a deeper nested object/array).
 * @example ```tsx
 * const node = diff(input, initial).address
 * if (isDiffEntry(node)) node.inputValue // whole address differs
 * else node?.street // difference is deeper
 * ```
 */
export function isDiffEntry<TNode>(node: TNode): node is Extract<TNode, DiffEntry> {
	return (
		typeof node === "object" &&
		node !== null &&
		// a nested container keyed "path" holds an entry object there, never a string
		typeof (node as { path?: unknown }).path === "string" &&
		"inputValue" in node &&
		"initialValue" in node
	)
}

/**
 * Recursively compares `input` against `initial` and returns only the values that differ.
 *
 * - Objects are compared key by key (keys of both sides), missing keys are `undefined`
 * - Arrays are paired by `options.onArrayDiff` (by index by default) and each pair is compared recursively
 * - Leaves are compared by `options.isEqual` (by {@link isEqualLeaf} by default); `Date` is compared by value
 * - Structural mismatch (e.g. object vs primitive, added/removed row) reports the whole value at that path
 * - Values that are not serializable (functions, symbols, bigints, `Map`, `Set`, class instances, …) and circular
 *   references are skipped
 * - Identical object/array references are considered equal without walking them
 *
 * @remarks Inputs are never mutated; entries hold references to the original values. In `output: "flat"`, keys that
 * contain `.` produce ambiguous paths. Nested results contain sparse arrays when only some indices differ.
 * @param input current object (e.g. form state)
 * @param initial object to compare against (e.g. initial form data)
 * @param options
 * @example ```tsx
 * diff({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } })
 * // -> { b: { c: { path: "b.c", inputValue: 2, initialValue: 3 } } }
 *
 * diff({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } }, { output: "flat" })
 * // -> { "b.c": { path: "b.c", inputValue: 2, initialValue: 3 } }
 * ```
 */
export function diff<T extends object>(
	input: T,
	initial: NoInfer<DeepPartial<T>>,
	options: DiffOptions & { output: "flat" }
): DiffFlat<T>
export function diff<T extends object>(
	input: T,
	initial: NoInfer<DeepPartial<T>>,
	options?: DiffOptions & { output?: "nested" }
): DiffNested<T>
export function diff<T extends object>(
	input: T,
	initial: NoInfer<DeepPartial<T>>,
	options?: DiffOptions
): DiffNested<T> | DiffFlat<T>
export function diff<T extends object>(
	input: T,
	initial: NoInfer<DeepPartial<T>>,
	options?: DiffOptions
): DiffNested<T> | DiffFlat<T> {
	if (options?.output === "flat") {
		const result: Record<string, DiffEntry> = {}
		walkDiff(
			input,
			initial,
			(segments, entry) => {
				result[toPath(segments)] = entry
				return false
			},
			options
		)
		return result as DiffFlat<T>
	}

	const root: Record<PathSegment, unknown> = Array.isArray(input) ? ([] as unknown as Record<PathSegment, unknown>) : {}
	walkDiff(input, initial, createNestedSink(root), options)
	return root as DiffNested<T>
}

/**
 * Writes entries into `root` along their path, creating arrays for numeric segments and objects otherwise. Only
 * containers created here are descended into, so a repeated path (last one wins) never writes into an entry.
 */
function createNestedSink(root: Record<PathSegment, unknown>): DiffSink {
	const containers = new WeakSet<object>([root])

	return (segments, entry) => {
		let node = root
		for (let i = 0; i < segments.length - 1; i++) {
			const segment = segments[i]
			let child = Object.hasOwn(node, segment) ? node[segment] : undefined
			if (typeof child !== "object" || child === null || !containers.has(child)) {
				child = typeof segments[i + 1] === "number" ? [] : {}
				containers.add(child as object)
				node[segment] = child
			}
			node = child as Record<PathSegment, unknown>
		}
		node[segments[segments.length - 1]] = entry
		return false
	}
}
