import { DataFrame, Serie } from '@youwol/dataframe'
import { minMax } from '@youwol/math'
import { InterpolateInGrid2D } from '../InterpolateInGrid2D'
import { Normalizer } from './Normalizer'
import { streamLinesExtractor } from './streamLinesExtractor'
import { Vector } from './Vector'

export function generateStreamLinesFromUnstructured({
    positions,
    indices,
    vectorField,
    seeds = undefined,
    nx = 100,
    ny = 100,
    maximumPointsPerLine = 50,
    dSep = 0.1,
    timeStep = 0.05,
    dTest = 0.05,
    maxTimePerIteration = 1000,
}: {
    positions: Serie
    indices: Serie
    vectorField: Serie

    seeds?: number[]
    nx?: number
    ny?: number
    maximumPointsPerLine?: number
    dSep?: number
    timeStep?: number
    dTest?: number
    maxTimePerIteration?: number
}): DataFrame[] {
    // Normalize the grid position
    //
    const normalizer = new Normalizer(minMax(positions), 0.1)

    const npositions = normalizer.normalize(positions) as Serie
    const bounds = minMax(npositions)

    // Prepare the interpolator
    //
    const interpolator = new InterpolateInGrid2D({
        positions: npositions,
        indices: indices,
        attribute: vectorField,
        nx,
        ny,
        flatten: true,
        scaling: 1,
    })

    // Get the seed points and normalize them
    //
    let SEEDS = undefined
    if (seeds) {
        SEEDS = []
        const seeds1 = Serie.create({ array: seeds, itemSize: 3 }).map((s) =>
            normalizer.normalize(s),
        )
        seeds1.forEach((v) => SEEDS.push({ x: v[0], y: v[1] }))
    }

    // Extract the streamlines
    //
    const lines = streamLinesExtractor({
        vectorField: (p) => {
            const v = interpolator.interpolate([p.x, p.y])
            if (v === undefined) {
                return undefined
            }
            return new Vector(v[0], v[1])
            // const l = v[0]**2 + v[1]**2 + v[2]**2
            // return new Vector(v[0]/l, v[1]/l)
        },
        bounds,
        maximumPointsPerLine,
        maxTimePerIteration,
        dSep,
        timeStep,
        dTest,
        seedArray: SEEDS,
    })

    // Denormalize the generated streamlines
    //
    lines.forEach((line) => {
        line.series.positions = normalizer.denormalize(
            line.series.positions,
        ) as Serie
    })

    return lines
}
