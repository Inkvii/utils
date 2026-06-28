/**
 * Used for checking that all values are accounted for in a switch
 * ```typescript
 * type Test = "a"|"b"|"c"
 * switch(test) {
 *   case "a": ...
 *   case "b": ...
 *   default: triggerExhaustiveSwitch(test, "My component name")
 * }
 * ```
 * @param value value in switch
 * @param componentName name used for debugging purposes. Usually name of the component where switch lives
 */
export function triggerExhaustiveSwitch(value: never, componentName: string): never {
	// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
	throw new Error(`Unhandled ${componentName} type for value [${value}]`)
}
