# random

Random integer generation: a bounded random integer, and a "marginal change" helper for nudging a value up or down by
fixed and percentage margins.

All exports are available under the `randomUtils` namespace from the package root:

```ts
import { randomUtils } from "@1nkvi/utils"
```

Option types live on the same namespace, e.g. `randomUtils.RandomOptions`.

---

## `randomUtils.random(min, max, options?)`

Returns a random integer between `min` and `max`. Both bounds are inclusive by default.

```ts
randomUtils.random(min: number, max: number, options?: RandomOptions): number
```

| Parameter | Type            | Description                                             |
| --------- | --------------- | ------------------------------------------------------- |
| `min`     | `number`        | Minimum value (inclusive by default). Must be `<= max`. |
| `max`     | `number`        | Maximum value (inclusive by default). Must be `>= min`. |
| `options` | `RandomOptions` | Optionally exclude one or both bounds.                  |

- Only integers inside the interval are returned, so non-integer bounds are rounded inwards — `random(1.5, 3)` returns
  `2` or `3`.
- `min === max` returns that value, unless one of its bounds is excluded.
- Throws `Min must be less than or equal to max...` when `min > max`.
- Throws `Cannot generate random integer from interval ...` when the interval contains no integer (e.g.
  `randomUtils.random(1.2, 1.8)` or `randomUtils.random(1, 2, { excludeMin: true, excludeMax: true })`).

### `RandomOptions`

| Option       | Type   | Effect                                   |
| ------------ | ------ | ---------------------------------------- |
| `excludeMin` | `true` | Exclude `min` from the possible results. |
| `excludeMax` | `true` | Exclude `max` from the possible results. |

```ts
randomUtils.random(1, 10) // → integer in <1, 10>
randomUtils.random(5, 5) // → 5
randomUtils.random(0, 10, { excludeMin: true }) // → integer in (0, 10>
randomUtils.random(0, 10, { excludeMax: true }) // → integer in <0, 10)
randomUtils.random(1, 5, { excludeMin: true, excludeMax: true }) // → integer in (1, 5), i.e. 2, 3 or 4
randomUtils.random(1.5, 3) // → 2 or 3
randomUtils.random(0, 0, { excludeMin: true }) // throws — no integer in (0, 0>
```

---

## `randomUtils.randomMarginalChange(value, options)`

Takes an initial value and produces a random integer within a margin around it. The margin is built from optional fixed
offsets and percentage multipliers, then optionally clamped to absolute bounds. Insert percentages as decimals — `100%`
= `1.00`, `1%` = `0.01`. Returns a random integer.

```ts
randomUtils.randomMarginalChange(value: number, options: RandomMarginalChangeOptions): number
```

The bounds are computed as:

- `min = (value + minFixed) * minPercentage`
- `max = (value + maxFixed) * maxPercentage`

then a `randomUtils.random(min, max)` is drawn and clamped to `absoluteMin` / `absoluteMax` if provided (`0` is a valid
bound).

- If the computed `min` is greater than `max` (e.g. for a negative `value`), the bounds are swapped.
- If the interval contains no integer (e.g. `<100.2, 100.4>`), its rounded middle is returned instead of throwing.

### `RandomMarginalChangeOptions`

| Option          | Type     | Default | Effect                                                         |
| --------------- | -------- | ------- | -------------------------------------------------------------- |
| `minFixed`      | `number` | `0`     | Value added to `min` before the percentage is applied.         |
| `maxFixed`      | `number` | `0`     | Value added to `max` before the percentage is applied.         |
| `minPercentage` | `number` | `1.00`  | Multiplier applied to the resulting `min`.                     |
| `maxPercentage` | `number` | `1.00`  | Multiplier applied to the resulting `max`.                     |
| `absoluteMin`   | `number` | —       | Returned instead if the computed result is below this floor.   |
| `absoluteMax`   | `number` | —       | Returned instead if the computed result is above this ceiling. |

```ts
randomUtils.randomMarginalChange(100, { minFixed: -10, maxFixed: 10, minPercentage: 0.9, maxPercentage: 1.1 })
// interval min: (100 - 10) * 0.9 = 81; max: (100 + 10) * 1.1 = 121
// → random integer in <81, 121>

// Clamp the downward drift to a floor
randomUtils.randomMarginalChange(50, { minPercentage: 0.8, maxPercentage: 1.0, absoluteMin: 45 })
// → never below 45

// Negative values: bounds (-90, -110) are swapped
randomUtils.randomMarginalChange(-100, { minPercentage: 0.9, maxPercentage: 1.1 })
// → random integer in <-110, -90>

// No integer in <100.2, 100.4>
randomUtils.randomMarginalChange(100, { minFixed: 0.2, maxFixed: 0.4 })
// → 100
```
