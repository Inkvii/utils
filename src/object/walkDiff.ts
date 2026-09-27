import { diffByIndex } from "~/array/diffByIndex"
import { isPlainObject } from "~/guard/utils"
import { isEqualLeaf } from "~/object/isEqualLeaf"
import type { DiffEntry, DiffOptions } from "~/object/diff"

export type PathSegment = string | number

/**
 * Receives every found difference. Returning `true` stops the whole walk.
 */
export type DiffSink = (segments: readonly PathSegment[], entry: DiffEntry) => boolean

interface WalkState {
	options: Omit<DiffOptions, "output"> | undefined
	emit: DiffSink
	inputAncestors: WeakSet<object>
	initialAncestors: WeakSet<object>
}

/**
 * Shared engine of {@link diff} and {@link hasDiff}. Recursively compares `input` against `initial` and reports every
 * difference to `emit`.
 */
export function walkDiff(
	input: unknown,
	initial: unknown,
	emit: DiffSink,
	options: Omit<DiffOptions, "output"> | undefined
): void {
	if (!isSerializable(input) || !isSerializable(initial)) return

	const state: WalkState = {
		options,
		emit,
		inputAncestors: new WeakSet(),
		initialAncestors: new WeakSet(),
	}
	const [rootInput, rootInitial] = normalizeRoots(input, initial)
	walk(rootInput, rootInitial, [], state)
}

/**
 * Differences can't be reported at the root (there is no path to put them on), so a root that is not a container of
 * the same kind as the other root is treated as an empty container. All leaves of the other side are then reported.
 */
function normalizeRoots(input: unknown, initial: unknown): [unknown, unknown] {
	if (Array.isArray(input)) return [input, Array.isArray(initial) ? initial : []]
	if (isPlainObject(input)) return [input, isPlainObject(initial) ? initial : {}]
	if (Array.isArray(initial)) return [[], initial]
	if (isPlainObject(initial)) return [{}, initial]
	return [{}, {}]
}

function walk(input: unknown, initial: unknown, segments: PathSegment[], state: WalkState): boolean {
	const { options } = state
	if (segments.length > 0 && options?.ignore?.(toPath(segments))) return false
	if (!isSerializable(input) || !isSerializable(initial)) return false
	if (isAncestor(input, state.inputAncestors) || isAncestor(initial, state.initialAncestors)) return false

	if (isPlainObject(input) && isPlainObject(initial)) {
		if (input === initial) return false
		return withAncestors(input, initial, state, () => walkObject(input, initial, segments, state))
	}

	if (Array.isArray(input) && Array.isArray(initial)) {
		if (input === initial) return false
		return withAncestors(input, initial, state, () => walkArray(input, initial, segments, state))
	}

	const path = toPath(segments)
	const isStructuralMismatch = isContainer(input) || isContainer(initial)
	if (!isStructuralMismatch && (options?.isEqual ?? isEqualLeaf)(input, initial, path)) return false

	return state.emit(segments, { path, inputValue: input, initialValue: initial })
}

function walkObject(
	input: Record<string, unknown>,
	initial: Record<string, unknown>,
	segments: PathSegment[],
	state: WalkState
): boolean {
	const keys = new Set([...Object.keys(input), ...Object.keys(initial)])
	for (const key of keys) {
		if (key === "__proto__") continue
		if (walk(getOwn(input, key), getOwn(initial, key), [...segments, key], state)) return true
	}
	return false
}

function walkArray(input: unknown[], initial: unknown[], segments: PathSegment[], state: WalkState): boolean {
	const onArrayDiff = state.options?.onArrayDiff ?? diffByIndex
	for (const pair of onArrayDiff(input, initial, { path: toPath(segments) })) {
		if (walk(pair.inputValue, pair.initialValue, [...segments, pair.index], state)) return true
	}
	return false
}

/**
 * Marks both containers as ancestors while their children are walked, so a circular reference back to them is
 * skipped. They are removed afterwards, so shared (non‑circular) references are still compared.
 */
function withAncestors(input: object, initial: object, state: WalkState, callback: () => boolean): boolean {
	state.inputAncestors.add(input)
	state.initialAncestors.add(initial)
	try {
		return callback()
	} finally {
		state.inputAncestors.delete(input)
		state.initialAncestors.delete(initial)
	}
}

/**
 * Reads only own keys, so a key missing on one side never resolves to an inherited value (e.g. `toString`).
 */
function getOwn(object: Record<string, unknown>, key: string): unknown {
	return Object.hasOwn(object, key) ? object[key] : undefined
}

function isAncestor(value: unknown, ancestors: WeakSet<object>): boolean {
	return typeof value === "object" && value !== null && ancestors.has(value)
}

export function toPath(segments: readonly PathSegment[]): string {
	return segments.join(".")
}

function isContainer(value: unknown): boolean {
	return Array.isArray(value) || isPlainObject(value)
}

/**
 * JSON‑like values that can be compared. Everything else (functions, symbols, bigints, `Map`, `Set`, `RegExp`,
 * boxed primitives, class instances, …) is skipped by the diff.
 */
function isSerializable(value: unknown): boolean {
	switch (typeof value) {
		case "string":
		case "number":
		case "boolean":
		case "undefined":
			return true
		case "object":
			return value === null || value instanceof Date || isContainer(value)
		default:
			return false
	}
}
