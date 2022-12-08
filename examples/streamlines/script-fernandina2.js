const fs = require('fs')
const math = require('@youwol/math')
const df = require('@youwol/dataframe')
const io = require('@youwol/io')
const geom = require('../../dist/@youwol/geometry')

const filename = '/Users/fmaerten/data/arch/fernandina/out/result-grid-4.ts'
const grid = io.decodeGocadTS(fs.readFileSync(filename, 'utf8'))[0]

const vectorAttribute = grid.series.Joint

const normalizer = new geom.Normalizer(math.minMax(grid.series.positions), 0.1)
grid.series.positions = normalizer.normalize(grid.series.positions)
const bounds = math.minMax(grid.series.positions)

const nx = 100
const ny = 100

const interpolator = new geom.InterpolateInGrid2D({
    positions: grid.series.positions,
    indices: grid.series.indices,
    attribute: vectorAttribute,
    nx,
    ny,
    flatten: true,
    scaling: 1,
})

let lines = geom.streamLinesExtractor({
    vectorField: (p) => {
        const v = interpolator.interpolate([p.x, p.y])
        return v === undefined ? undefined : new geom.Vector(v[0], v[1])
    },
    dims: [nx, ny],
    bounds,
    maximumPointsPerLine: 50,
    dSep: 0.1,
})

// Array of DataFrame
// Each dataframe has a positions Serie
// Have to transform this serie
lines.forEach((line) => {
    line.series.positions = normalizer.denormalize(line.series.positions)
})

console.log(lines.length, 'lines')

fs.writeFileSync(
    '/Users/fmaerten/data/arch/fernandina/out/streamlines.pl',
    io.encodeGocadPL(lines),
    'utf8',
)
