# Perceptual Contrast Palette

Generate color palettes with predictable, perceptually uniform contrast levels inspired by [APCA](https://github.com/Myndex/apca-w3) (Accessible Perceptual Contrast Algorithm).

## What it does

Creates color scales where each step corresponds to a specific perceptual contrast value against white. Uses OKHSL color space and accounts for the Bezold-Brücke effect (hue shifts in shadows/highlights).

## Installation

```bash
npm install
npm run build
```

## Usage

### CLI

Generate a palette with default colors:

```bash
npm run generate
```

Save to file:

```bash
npm run generate:save
```

Custom configuration:

```bash
npm run generate -- --config your-config.json --output palette.json
```

### Config format

```json
{
    "steps": [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    "colors": {
        "blue": { "hue": 255, "minChroma": 0, "maxChroma": 1 },
        "gray": { "hue": 0, "minChroma": 0, "maxChroma": 0 }
    }
}
```

### Programmatic

```typescript
import { generateColorScale } from "./src/generateColorScale.js"

const scale = generateColorScale({
    baseHue: 255,
    minChroma: 0,
    maxChroma: 1,
    steps: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
})
```

## Testing

```bash
npm test
```

Tests verify that generated colors match expected APCA contrast values.

## References

-   Algorithm derived from [Matthew Ström-Awn's color palette generation](https://mattstromawn.com/writing/generating-color-palettes/)
-   [APCA contrast algorithm](https://github.com/Myndex/apca-w3)
-   [OKHSL color space](https://bottosson.github.io/posts/colorpicker/)
-   [Color.js](https://colorjs.io/) for color space conversions

## License

MIT - See LICENSE file for details
