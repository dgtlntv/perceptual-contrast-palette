#!/usr/bin/env node

import * as fs from "fs"
import { generateColorScale } from "./generateColorScale.js"
import { srgbToHex } from "./utils/colorConversions.js"

interface ColorDefinition {
    hue: number
    minChroma: number
    maxChroma: number
}

interface ColorConfig {
    steps: number[]
    colors: Record<string, ColorDefinition>
}

const defaultConfig: ColorConfig = {
    steps: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    colors: {
        gray: { hue: 0, minChroma: 0, maxChroma: 0 },
        blue: { hue: 255.82972827643948, minChroma: 0, maxChroma: 1 },
        green: { hue: 144.25507212116702, minChroma: 0, maxChroma: 1 },
        red: { hue: 23.583142756007362, minChroma: 0, maxChroma: 1 },
        yellow: { hue: 66.805046608657, minChroma: 0, maxChroma: 1 },
        purple: { hue: 303.61620531520055, minChroma: 0, maxChroma: 1 },
        teal: { hue: 205.09880393162302, minChroma: 0, maxChroma: 1 },
        orange: { hue: 37.756200794074346, minChroma: 0, maxChroma: 1 },
    },
}

const HELP_TEXT = `
Usage: generate-palette [options]

Options:
  -c, --config <path>   Path to JSON config file (optional)
  -o, --output <path>   Save output to JSON file instead of printing
  -f, --format <type>   Output format: "hex" or "srgb" (default: "hex")
  -h, --help            Show this help message

Config file format:
{
  "steps": [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
  "colors": {
    "red": { "hue": 0, "minChroma": 0, "maxChroma": 1 },
    "blue": { "hue": 210, "minChroma": 0, "maxChroma": 1 },
    "gray": { "hue": 0, "minChroma": 0, "maxChroma": 0 }
  }
}

Default config is used if no config file is provided.
`

function generatePalette(config: ColorConfig, format: "hex" | "srgb" = "hex") {
    const palette: Record<string, Record<number, [number, number, number] | string>> = {}

    for (const [colorName, colorDef] of Object.entries(config.colors)) {
        const scale = generateColorScale({
            baseHue: colorDef.hue,
            minChroma: colorDef.minChroma,
            maxChroma: colorDef.maxChroma,
            steps: config.steps,
        })

        // Round sRGB components and convert to desired format
        const formattedScale: Record<number, [number, number, number] | string> = {}
        for (const [step, [r, g, b]] of Object.entries(scale)) {
            const roundedRgb: [number, number, number] = [
                Math.round(r),
                Math.round(g),
                Math.round(b),
            ]
            formattedScale[Number(step)] = format === "hex"
                ? srgbToHex(roundedRgb)
                : roundedRgb
        }
        palette[colorName] = formattedScale
    }

    return palette
}

function main() {
    const args = process.argv.slice(2)
    let config = defaultConfig
    let outputFile: string | null = null
    let format: "hex" | "srgb" = "hex"

    for (let i = 0; i < args.length; i++) {
        const arg = args[i]

        if (arg === "--config" || arg === "-c") {
            const configPath = args[++i]
            if (!configPath) {
                console.error("Error: --config requires a file path")
                process.exit(1)
            }
            try {
                const configContent = fs.readFileSync(configPath, "utf-8")
                config = JSON.parse(configContent)
            } catch (error) {
                console.error(`Error reading config file: ${error}`)
                process.exit(1)
            }
        } else if (arg === "--output" || arg === "-o") {
            outputFile = args[++i]
            if (!outputFile) {
                console.error("Error: --output requires a file path")
                process.exit(1)
            }
        } else if (arg === "--format" || arg === "-f") {
            const formatArg = args[++i]
            if (!formatArg) {
                console.error("Error: --format requires a value (hex or srgb)")
                process.exit(1)
            }
            if (formatArg !== "hex" && formatArg !== "srgb") {
                console.error("Error: --format must be either 'hex' or 'srgb'")
                process.exit(1)
            }
            format = formatArg
        } else if (arg === "--help" || arg === "-h") {
            console.log(HELP_TEXT)
            process.exit(0)
        }
    }

    const palette = generatePalette(config, format)

    if (outputFile) {
        try {
            fs.writeFileSync(outputFile, JSON.stringify(palette, null, 2))
            console.log(`Palette saved to ${outputFile}`)
        } catch (error) {
            console.error(`Error writing output file: ${error}`)
            process.exit(1)
        }
    } else {
        console.log(JSON.stringify(palette, null, 2))
    }
}

main()
