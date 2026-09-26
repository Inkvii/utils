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

- `min === max` returns that value.
- Throws `Min must be greater than max...` when `min > max`.
- Throws when both bounds are excluded but the interval is too narrow to produce a value (e.g.
  `randomUtils.random(1, 2, { excludeMin: true, excludeMax: true })`).

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
```

---

## `randomUtils.randomMarginalChange(value, options)`

Takes an initial value and produces a random integer within a margin around it. The margin is built from optional fixed
offsets and percentage multipliers, then optionally clamped to absolute bounds. Insert percentages as decimals — `100%`
= `1.00`, `1%` = `0.01`. Returns a (rounded) random value.

```ts
randomUtils.randomMarginalChange(value: number, options: RandomMarginalChangeOptions): number
```

The bounds are computed as:

- `min = (value + minFixed) * minPercentage`
- `max = (value + maxFixed) * maxPercentage`

then a `randomUtils.random(min, max)` is drawn and clamped to `absoluteMin` / `absoluteMax` if provided.

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
```
