# random

Random integer generation: a bounded random integer, and a "marginal change" helper for nudging a value up or down by
fixed and percentage margins.

All exports are available from the package root:

```ts
import { random, randomMarginalChange } from "@1nkvi/utils"
```

---

## `random(min, max, options?)`

Returns a random integer between `min` and `max`. Both bounds are inclusive by default.

```ts
random(min: number, max: number, options?: RandomOptions): number
```

| Parameter | Type            | Description                                             |
| --------- | --------------- | ------------------------------------------------------- |
| `min`     | `number`        | Minimum value (inclusive by default). Must be `<= max`. |
| `max`     | `number`        | Maximum value (inclusive by default). Must be `>= min`. |
| `options` | `RandomOptions` | Optionally exclude one or both bounds.                  |

- `min === max` returns that value.
- Throws `Min must be greater than max...` when `min > max`.
- Throws when both bounds are excluded but the interval is too narrow to produce a value (e.g.
  `random(1, 2, { excludeMin: true, excludeMax: true })`).

### `RandomOptions`

| Option       | Type   | Effect                                   |
| ------------ | ------ | ---------------------------------------- |
| `excludeMin` | `true` | Exclude `min` from the possible results. |
| `excludeMax` | `true` | Exclude `max` from the possible results. |

```ts
random(1, 10) // → integer in <1, 10>
random(5, 5) // → 5
random(0, 10, { excludeMin: true }) // → integer in (0, 10>
random(0, 10, { excludeMax: true }) // → integer in <0, 10)
```

---

## `randomMarginalChange(value, options)`

Takes an initial value and produces a random integer within a margin around it. The margin is built from optional fixed
offsets and percentage multipliers, then optionally clamped to absolute bounds. Insert percentages as decimals — `100%`
= `1.00`, `1%` = `0.01`. Returns a (rounded) random value.

```ts
randomMarginalChange(value: number, options: RandomMarginalChangeOptions): number
```

The bounds are computed as:

- `min = (value + minFixed) * minPercentage`
- `max = (value + maxFixed) * maxPercentage`

then a `random(min, max)` is drawn and clamped to `absoluteMin` / `absoluteMax` if provided.

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
randomMarginalChange(100, { minFixed: -10, maxFixed: 10, minPercentage: 0.9, maxPercentage: 1.1 })
// interval min: (100 - 10) * 0.9 = 81; max: (100 + 10) * 1.1 = 121
// → random integer in <81, 121>

// Clamp the downward drift to a floor
randomMarginalChange(50, { minPercentage: 0.8, maxPercentage: 1.0, absoluteMin: 45 })
// → never below 45
```
