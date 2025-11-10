/**
 * This code is based on the formulas used by APCA (Accessible Perceptual Contrast Algorithm),
 * a perceptually uniform contrast algorithm designed for readability and accessibility.
 * APCA accounts for how human vision perceives contrast and luminance differences.
 *
 * The original APCA code can be found at: https://github.com/Myndex/apca-w3
 *
 * This implementation likely does not comply with the APCA trademark license requirements.
 * Therefore, I do not use "APCA" in this code or claim that it is APCA-compliant.
 * This is an independent implementation for perceptual contrast calculations.
 */
/**
 * Constants used in perceptual contrast calculations
 * Inspired by the formula found at https://github.com/Myndex/apca-w3/blob/c012257167d822f91bc417120bdb82e1b854b4a4/src/apca-w3.js#L146
 */

const PERCEPTUAL_CONTRAST_CONSTANTS: {
    BLACK_THRESHOLD: number
    BLACK_CLAMP: number
    OFFSET: number
    SCALE: number
    MAGIC_OFFSET_IN: number
    MAGIC_OFFSET_OUT: number
    MAGIC_FACTOR: number
    MAGIC_EXPONENT: number
    MACIG_FACTOR_INVERSE: number
} = {
    BLACK_THRESHOLD: 0.022,
    BLACK_CLAMP: 1.414,
    OFFSET: 0.027,
    SCALE: 1.14,
    MAGIC_OFFSET_IN: 0.0387393816571401,
    MAGIC_OFFSET_OUT: 0.312865795870758,
    MAGIC_FACTOR: 1.9468554433171,
    MAGIC_EXPONENT: 0.283343396420869 / 1.414,
    MACIG_FACTOR_INVERSE: 1 / 1.9468554433171,
}

/**
 * Removes clamping from near-black colors to restore original values
 * Inspired by the formula found at: https://github.com/Myndex/apca-w3/blob/c012257167d822f91bc417120bdb82e1b854b4a4/src/apca-w3.js#L403
 * @param y - The clamped luminance value to be unclamped
 * @returns The unclamped luminance value
 */
function unclampY(y: number): number {
    return y > PERCEPTUAL_CONTRAST_CONSTANTS.BLACK_THRESHOLD
        ? y
        : Math.pow(
              (y + PERCEPTUAL_CONTRAST_CONSTANTS.MAGIC_OFFSET_IN) *
                  PERCEPTUAL_CONTRAST_CONSTANTS.MAGIC_FACTOR,
              PERCEPTUAL_CONTRAST_CONSTANTS.MAGIC_EXPONENT
          ) *
              PERCEPTUAL_CONTRAST_CONSTANTS.MACIG_FACTOR_INVERSE -
              PERCEPTUAL_CONTRAST_CONSTANTS.MAGIC_OFFSET_OUT
}

/**
 * Applies clamping to near-black colors to prevent contrast calculation issues
 * Inspired by the formula found at: https://github.com/Myndex/apca-w3/blob/c012257167d822f91bc417120bdb82e1b854b4a4/src/apca-w3.js#L381
 * @param y - The luminance value to be clamped
 * @returns The clamped luminance value
 */
function clampY(y: number): number {
    return y >= PERCEPTUAL_CONTRAST_CONSTANTS.BLACK_THRESHOLD
        ? y
        : y +
              Math.pow(
                  PERCEPTUAL_CONTRAST_CONSTANTS.BLACK_THRESHOLD - y,
                  PERCEPTUAL_CONTRAST_CONSTANTS.BLACK_CLAMP
              )
}

/**
 * Reverses perceptual contrast calculations to find a matching luminance
 * Inspired by the formula found at: https://github.com/Myndex/apca-w3/blob/c012257167d822f91bc417120bdb82e1b854b4a4/images/APCAw3_0.1.17_APCA0.0.98G.svg
 * @param contrast - Target contrast value (between 5 and 106.04066)
 * @param y - Known luminance value (between 0 and 1)
 * @param bgIsDarker - Whether the background is darker than the text
 * @param lookingFor - What we're solving for: "txt" (text color) or "bg" (background color)
 * @returns The calculated luminance value, or false if no valid solution exists
 */
export function reversePerceptualContrast(
    contrast: number = 75, // Default contrast of 75
    y: number = 1, // Default luminance of 1
    bgIsDarker: boolean = false, // Default assumes background is lighter
    lookingFor: "txt" | "bg" = "txt" // Default solves for text color
): number | false {
    contrast = Math.abs(contrast)
    let output: number | undefined

    if (!(y > 0 && y <= 1)) {
        console.log("y is not a valid value (y > 0 && y <= 1)")
        return false
    }

    if (!(contrast >= 5 && contrast <= 106.04066)) {
        console.log(
            "contrast is not a valid value (contrast >= 5 && contrast <= 106.04066)"
        )
        return false
    }

    // Apply clamping to input luminance
    y = clampY(y)

    // Calculate output luminance based on what we're looking for and background darkness
    // You could do these calculations here more DRY, but I find that it is easier to
    // understand the derivation from the original calculation with the if statements.

    if (lookingFor === "txt") {
        if (bgIsDarker) {
            // For light text on dark background
            output =
                (y ** 0.65 -
                    (-contrast / 100 - PERCEPTUAL_CONTRAST_CONSTANTS.OFFSET) *
                        (1 / PERCEPTUAL_CONTRAST_CONSTANTS.SCALE)) **
                (1 / 0.62)
        } else if (!bgIsDarker) {
            // For dark text on light background
            output =
                (y ** 0.56 -
                    (contrast / 100 + PERCEPTUAL_CONTRAST_CONSTANTS.OFFSET) *
                        (1 / PERCEPTUAL_CONTRAST_CONSTANTS.SCALE)) **
                (1 / 0.57)
        }
    } else if (lookingFor === "bg") {
        if (bgIsDarker) {
            // For dark background with light text
            output =
                (y ** 0.62 +
                    (-contrast / 100 - PERCEPTUAL_CONTRAST_CONSTANTS.OFFSET) *
                        (1 / PERCEPTUAL_CONTRAST_CONSTANTS.SCALE)) **
                (1 / 0.65)
        } else if (!bgIsDarker) {
            // For light background with dark text
            output =
                (y ** 0.57 +
                    (contrast / 100 + PERCEPTUAL_CONTRAST_CONSTANTS.OFFSET) *
                        (1 / PERCEPTUAL_CONTRAST_CONSTANTS.SCALE)) **
                (1 / 0.56)
        }
    }

    // Unclamp the output value if valid
    if (output !== undefined && !isNaN(output)) {
        output = unclampY(output)
    }

    // Validate final output
    if (
        output === undefined ||
        isNaN(output) ||
        !(output > 0 && output <= 1)
    ) {
        console.log("A color with the specifications does not exist")
        return false
    } else {
        return output
    }
}
