import { okhslToSrgb, yToOkhslLightness } from "./utils/colorConversions.js"
import { reversePerceptualContrast } from "./utils/reversePerceptualContrast.js"
/**
 * Color scale object with hex color values keyed by scale number
 */
interface ColorScale {
    [step: number]: [number, number, number]
}

/**
 * Compensates for the Bezold-Brücke effect where colors appear more purplish in shadows
 * and more yellowish in highlights by shifting the hue up to 5 degrees
 * Derived from https://mattstromawn.com/writing/generating-color-palettes/#putting-it-all-together%3A-all-the-code-you-need
 * Copyright (c) 2025 Matthew Ström-Awn
 * Licensed under MIT. See LICENSE file.
 * @param step - Scale step value (0-1000)
 * @param baseHue - Starting hue in degrees (0-360)
 * @returns Adjusted hue value
 * @throws If parameters are invalid
 */
function computeHue(step: number, baseHue: number): number {
    // Normalize step from 0-1000 range to 0-1
    const normalizedStep = step / 1000

    // Validate normalizedStep is between 0 and 1
    if (normalizedStep < 0 || normalizedStep > 1) {
        throw new Error("step must produce a normalized value between 0 and 1")
    }

    // Validate baseHue is between 0 and 360
    if (baseHue < 0 || baseHue > 360) {
        throw new Error("baseHue must be a number between 0 and 360")
    }

    if (baseHue === 0) {
        return baseHue
    }

    return baseHue + 5 * (1 - normalizedStep)
}

/**
 * Creates a parabolic function for chroma/saturation that peaks at middle values
 * This ensures colors are most vibrant in the middle of the scale while being
 * more subtle at the extremes
 * Derived from https://mattstromawn.com/writing/generating-color-palettes/#putting-it-all-together%3A-all-the-code-you-need
 * Copyright (c) 2025 Matthew Ström-Awn
 * Licensed under MIT. See LICENSE file.
 * @param step - Scale step value (0-1000)
 * @param minChroma - Minimum chroma/saturation value (0-1)
 * @param maxChroma - Maximum chroma/saturation value (0-1)
 * @returns Calculated chroma value
 * @throws If parameters are invalid
 */
function computeChroma(
    step: number,
    minChroma: number,
    maxChroma: number
): number {
    const normalizedStep = step / 1000

    // Validate normalizedStep is between 0 and 1
    if (normalizedStep < 0 || normalizedStep > 1) {
        throw new Error("step must produce a normalized value between 0 and 1")
    }

    // Validate chroma values are between 0 and 1 and properly ordered
    if (minChroma < 0 || minChroma > 1 || maxChroma < 0 || maxChroma > 1) {
        throw new Error("Chroma values must be numbers between 0 and 1")
    }
    if (minChroma > maxChroma) {
        throw new Error("minChroma must be less than or equal to maxChroma")
    }

    const chromaDifference = maxChroma - minChroma
    return (
        -4 * chromaDifference * Math.pow(normalizedStep, 2) +
        4 * chromaDifference * normalizedStep +
        minChroma
    )
}

/**
 * Computes OKHSL lightness from a target contrast step using perceptual contrast
 * Derived from https://mattstromawn.com/writing/generating-color-palettes/#putting-it-all-together%3A-all-the-code-you-need
 * Copyright (c) 2025 Matthew Ström-Awn
 * Licensed under MIT. See LICENSE file.
 * @param step - Scale step value (0-1000)
 * @returns OKHSL lightness value (0-1)
 * @throws If target luminance cannot be calculated
 */
function computeLightness(step: number): number {
    // Clip values below minimum threshold to full lightness (white)
    if (step < 50) {
        return 1
    }

    // Rescale 50-999 to perceptual contrast's 5-106.04066 range
    const perceptualContrast =
        5 + ((step - 50) * (106.04066 - 5)) / (1000 - 50)

    const targetLuminance = reversePerceptualContrast(
        perceptualContrast,
        1,
        false,
        "txt"
    )

    if (targetLuminance === false) {
        throw new Error(
            `Problem calculating the target luminance for step ${step}`
        )
    }

    return yToOkhslLightness(targetLuminance)
}

/**
 * Options for generating a color scale
 */
export interface GenerateColorScaleOptions {
    /** Base hue in degrees (0-360) */
    baseHue: number
    /** Minimum chroma/saturation (0-1) */
    minChroma: number
    /** Maximum chroma/saturation (0-1) */
    maxChroma: number
    /** Array of scale values to generate (integer values between 0-1000) */
    steps: number[]
}

/**
 * Generates a complete color scale with accessible contrast levels
 * @param options - Configuration object for color scale generation
 * @returns Scale object with color srgb values keyed by scale number
 */
export function generateColorScale(
    options: GenerateColorScaleOptions
): ColorScale {
    const { baseHue, minChroma, maxChroma, steps } = options

    if (baseHue < 0 || baseHue > 360) {
        throw new Error("baseHue must be a number between 0 and 360")
    }

    if (minChroma < 0 || minChroma > 1 || maxChroma < 0 || maxChroma > 1) {
        throw new Error("Chroma values must be numbers between 0 and 1")
    }

    if (minChroma > maxChroma) {
        throw new Error("minChroma must be less than or equal to maxChroma")
    }

    if (
        steps.some(
            (step) => step < 0 || step > 1000 || !Number.isInteger(step)
        )
    ) {
        throw new Error("All steps must be integers between 0 and 1000")
    }

    // Generate the color scale using map and reduce
    return steps.reduce<ColorScale>((scale, step) => {
        const h = computeHue(step, baseHue)
        const s = computeChroma(step, minChroma, maxChroma)
        const l = computeLightness(step)

        const srgb = okhslToSrgb([h, s, l])

        return { ...scale, [step]: srgb }
    }, {})
}
