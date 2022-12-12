const fs = require('fs')
const math = require('@youwol/math')
const df = require('@youwol/dataframe')
const io = require('@youwol/io')
const geom = require('../../dist/@youwol/geometry')

/*
function generateStreamLinesFromUnstructured({positions, indices, vectorField, seeds, nx=100, ny=100}) {
    // Normalize the grid position
    //
    const normalizer = new geom.Normalizer( math.minMax(positions), 0.1)

    const npositions = normalizer.normalize( positions )
    const bounds = math.minMax( npositions )

    // Prepare the interpolator
    //
    const interpolator = new geom.InterpolateInGrid2D({
        positions: npositions,
        indices  : indices,
        attribute: vectorField,
        nx,
        ny,
        flatten: true,
        scaling: 1
    })

    // Get two seed points, one for each sub-grid (Fernandina and the other)
    //
    let SEEDS = undefined
    if (seeds) {
        SEEDS = []
        let seeds1 = df.Serie.create({array: seeds, itemSize: 3})
            .map( s => normalizer.normalize(s) )
        seeds1.forEach( v => SEEDS.push({x: v[0], y: v[1]}) )
    }

    // Extract the streamlines
    //
    let lines = geom.streamLinesExtractor({
        vectorField: p => {
            const v = interpolator.interpolate([p.x, p.y])
            return v === undefined ? undefined : new geom.Vector(v[0], v[1])
        },
        bounds,
        maximumPointsPerLine: 50,
        dSep: 0.1,
        timeStep: 0.05,
        dTest: 0.05,
        seedArray: SEEDS
    })

    // Denormalize the generated streamlines
    //
    lines.forEach( line => {
        line.series.positions = normalizer.denormalize(line.series.positions)
    })

    return lines
}
*/

const filename =
    '/Users/fmaerten/data/arch/galapagos-all/model2/forward-grid-13500.ts'
const grid = io.merge(io.decodeGocadTS(fs.readFileSync(filename, 'utf8')))

const seeds = [675400, 9958543, -500, 699386, 9957051, -500]

const lines = geom.generateStreamLinesFromUnstructured({
    positions: grid.series.positions,
    indices: grid.series.indices,
    vectorField: grid.series.Joint,
    seeds,
    nx: 200,
    ny: 500,
})
fs.writeFileSync(
    '/Users/fmaerten/data/arch/galapagos-all/model2/out/streamlines.pl',
    io.encodeGocadPL(lines),
    'utf8',
)
