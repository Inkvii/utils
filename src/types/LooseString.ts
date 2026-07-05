/**
 * Allows user to insert any `string` but also provides autocomplete for `TType`
 * @example ```tsx
 * type Dark = "dark"|"light"
 *
 * const works: LooseString<Dark> = "dark"
 * const alsoWorks: LooseString<Dark> = "system"
 * ```
 */
export type LooseString<TType extends string> = TType | (string & {})
