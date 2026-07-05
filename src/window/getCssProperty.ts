/**
 * Retrieves css property based on the input.
 * @param propertyName full name of css property (e.g. `--breakpoint-lg`)
 * @param ref optional reference to html element. If not provided, root document is used
 * @remarks resulting string doesnt resolve calculations. If css variable contains e.g. `calc(2rem + 5%)`, the output will be this, not resulting value
 *
 * @example ```tsx
 * getCssProperty("--breakpoint-lg") // 64rem
 * getCssProperty("--radius-sm") // calc(0.625rem - 4px)
 * ```
 */
export function getCssProperty(propertyName: string, ref?: HTMLElement | null) {
	const el = ref ?? document.documentElement

	return window.getComputedStyle(el).getPropertyValue(propertyName)
}
