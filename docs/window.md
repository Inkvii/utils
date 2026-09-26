# window

Browser helpers that read from the DOM. These require a `window`/`document`, so they only run in the browser.

All exports are available under the `windowUtils` namespace from the package root:

```ts
import { windowUtils } from "@1nkvi/utils"
```

---

## `windowUtils.getCssProperty(propertyName, ref?)`

Reads the computed value of a CSS custom property (or any CSS property) from an element, defaulting to the root `<html>`
element.

```ts
windowUtils.getCssProperty(propertyName: string, ref?: HTMLElement | null): string
```

| Parameter      | Type                  | Description                                                                                  |
| -------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| `propertyName` | `string`              | Full property name, e.g. `--breakpoint-lg`.                                                  |
| `ref`          | `HTMLElement \| null` | Element to read from. When omitted or `null`, `document.documentElement` (`<html>`) is used. |

- **Computed, not resolved** — the returned string is the declared value; `calc(...)` and similar expressions are
  returned verbatim, not evaluated (e.g. `calc(0.625rem - 4px)` comes back as-is).
- **Returns a string** — an unset property yields an empty string, matching `getPropertyValue`.

```ts
windowUtils.getCssProperty("--breakpoint-lg") // → "64rem"
windowUtils.getCssProperty("--radius-sm") // → "calc(0.625rem - 4px)"
windowUtils.getCssProperty("--card-gap", cardEl) // → reads the variable as seen by `cardEl`
```
