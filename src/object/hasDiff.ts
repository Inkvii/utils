import type { DiffOptions } from "~/object/diff"
import type { DeepPartial } from "~/types/DeepPartial"
import { walkDiff } from "~/object/walkDiff"

/**
 * Returns `true` if `input` differs from `initial`. Uses the same rules and options as {@link diff}, but stops at the
 * first difference and doesn't build any result - handy as an "is dirty" check.
 *
 * @param input current object (e.g. form state)
 * @param initial object to compare against (e.g. initial form data)
 * @param options same as {@link diff} options, except `output`
 * @example hasDiff({ a: 1 }, { a: 1 }) // -> false
 * @example hasDiff({ a: 1 }, { a: 2 }) // -> true
 */
export function hasDiff<T extends object>(
	input: T,
	initial: NoInfer<DeepPartial<T>>,
	options?: Omit<DiffOptions, "output">
): boolean {
	let found = false
	walkDiff(
		input,
		initial,
		() => {
			found = true
			return true
		},
		options
	)
	return found
}
