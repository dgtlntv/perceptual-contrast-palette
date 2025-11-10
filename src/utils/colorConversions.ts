import Color from "colorjs.io"

/**
 * Converts OKHSl color to sRGB array
 * @param {OkHSL} hsl - Array containing [hue, saturation, lightness]
 *   hue: number (0-360) - The hue angle in degrees
 *   saturation: number (0-1) - The saturation value
 *   lightness: number (0-1) - The lightness value
 * @returns {[number, number, number]} sRGB array [r, g, b] in 0-255 range
 */
export function okhslToSrgb(
    hsl: [number, number, number]
): [number, number, number] {
    // Create new color in OKHSl space
    let c = new Color("okhsl", hsl)
    // Convert to sRGB color space
    c = c.to("srgb")

    return [c.srgb[0] * 255, c.srgb[1] * 255, c.srgb[2] * 255]
}

/**
 * Converts Y (luminance) value to OKHSL lightness
 * Inspired by the formula found at https://github.com/Myndex/apca-w3/blob/c012257167d822f91bc417120bdb82e1b854b4a4/src/apca-w3.js#L418
 * @param {number} y - Linear luminance value (0-1)
 * @returns {number} OKHSL lightness value (0-1)
 */
export function yToOkhslLightness(y: number): number {
    const srgbComponent = y ** (1 / 2.4)
    const c = new Color("srgb", [srgbComponent, srgbComponent, srgbComponent])
    return c.okhsl[2]
}

/**
 * Converts sRGB array to hex color string
 * @param {[number, number, number]} rgb - sRGB array [r, g, b] in 0-255 range
 * @returns {string} Hex color string (e.g., "#ff5733")
 */
export function srgbToHex(rgb: [number, number, number]): string {
    const c = new Color("srgb", [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255])
    return c.toString({ format: "hex" })
}
