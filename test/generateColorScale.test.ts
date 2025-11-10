import { APCAcontrast, sRGBtoY } from "apca-w3"
import { generateColorScale } from "../src/generateColorScale.js"

const grayscale = generateColorScale({
    baseHue: 0,
    minChroma: 0,
    maxChroma: 0,
    steps: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
})

console.log("Generated grayscale palette:")
console.log(grayscale)

const blackWhiteContrast = APCAcontrast(
    sRGBtoY([0, 0, 0]),
    sRGBtoY([255, 255, 255])
)
console.log(
    `\nBlack [0,0,0] vs White [255,255,255] contrast: ${blackWhiteContrast}`
)

console.log("\nTesting contrast values:\n")

let allTestsPassed = true

// Test all reference points from 0 onwards
for (const referenceStep of [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]) {
    if (referenceStep > 0) {
        console.log("\n" + "=".repeat(60))
    }
    console.log(
        `Testing contrast values (starting from step ${referenceStep}):\n`
    )

    const referenceColor = grayscale[referenceStep]
    const testSteps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].filter(
        (s) => s > referenceStep
    )

    for (const step of testSteps) {
        const testColor = grayscale[step]

        const contrastResult = APCAcontrast(
            sRGBtoY(testColor),
            sRGBtoY(referenceColor)
        )
        const contrast =
            typeof contrastResult === "string"
                ? parseFloat(contrastResult)
                : contrastResult

        // The expected difference should be the same as (step - referenceStep)
        const relativeStep = step - referenceStep
        let expectedContrast: number
        if (relativeStep < 5) {
            expectedContrast = 0
        } else {
            expectedContrast =
                5 + ((relativeStep - 5) * (106.04066 - 5)) / (100 - 5)
        }

        const marginOfError = 3
        const difference = Math.abs(
            Math.abs(Math.round(contrast)) - Math.round(expectedContrast)
        )
        const passed = difference <= marginOfError

        if (!passed) {
            allTestsPassed = false
        }

        console.log(
            `Step ${step.toString().padStart(3)}: ${Math.round(
                testColor[0]
            )}, ${Math.round(testColor[1])}, ${Math.round(
                testColor[2]
            )} vs ${Math.round(referenceColor[0])}, ${Math.round(
                referenceColor[1]
            )}, ${Math.round(referenceColor[2])}`
        )
        console.log(
            `  Expected: ${Math.round(expectedContrast)}, Got: ${Math.round(
                contrast
            )}, Difference: ${difference}${
                difference > 0 ? " (margin: ±3)" : ""
            } ${passed ? "✓" : "✗"}`
        )
    }
}

console.log(
    `\n${allTestsPassed ? "✓ All tests passed!" : "✗ Some tests failed"}`
)

process.exit(allTestsPassed ? 0 : 1)
