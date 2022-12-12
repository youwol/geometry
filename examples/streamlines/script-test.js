const fs = require('fs')
const df = require('@youwol/dataframe')
const math = require('@youwol/math')
const io = require('@youwol/io')
const geom = require('../../dist/@youwol/geometry')

class Normalizer {
    constructor(bounds, scaling = 1) {
        if (bounds.length !== 6) {
            throw new Error(
                'bounds is an array of length 6 ([xmin,ymin,zmin, xmax,ymax,zmax])',
            )
        }
        this.bounds = bounds
        this.width = (bounds[3] - bounds[0]) * scaling
        this.height = (bounds[4] - bounds[1]) * scaling
        this.length = Math.max(this.width, this.height)
        this.center = [(bounds[3] + bounds[0]) / 2, (bounds[4] + bounds[1]) / 2]
    }

    normalize(p) {
        if (df.Serie.isSerie(p)) {
            const s = p.map((q) => this.normalize(q))
            return s
        }
        const X = (p[0] - this.center[0]) / this.length
        const Y = (p[1] - this.center[1]) / this.length
        if (p.length === 2) {
            return [X, Y]
        } else {
            return [X, Y, p[2]]
        }
    }
    denormalize(p) {
        if (p instanceof df.Serie) {
            return p.map((q) => this.denormalize(q))
        }
        const X = p[0] * this.length + this.center[0]
        const Y = p[1] * this.length + this.center[1]

        if (p.length === 2) {
            return [X, Y]
        } else {
            return [X, Y, p[2]]
        }
    }
}

const grid = geom.generateRectangle({
    a: 10,
    b: 20,
    na: 20,
    nb: 20,
    center: [0, 0, 0],
})
grid.series['U'] = grid.series.positions.map((p) => [p[0] ** 2, p[1], 0])

console.log(math.minMax(grid.series.positions))

const normalizer = new Normalizer(math.minMax(grid.series.positions))
let pos = normalizer.normalize(grid.series.positions)
pos = normalizer.denormalize(pos)

const seeds = [1, 1, 0]

const lines = geom.generateStreamLinesFromUnstructured({
    positions: grid.series.positions,
    indices: grid.series.indices,
    vectorField: grid.series.U,
    seeds,
    nx: 10,
    ny: 10,
    maximumPointsPerLine: 500,
    dSep: 0.4,
    timeStep: 0.05,
    dTest: 0.05,
    maxTimePerIteration: 1000,
})

console.log(lines)
fs.writeFileSync(
    '/Users/fmaerten/data/streamlines/test.pl',
    io.encodeGocadPL(lines),
    'utf8',
)
fs.writeFileSync(
    '/Users/fmaerten/data/streamlines/test.ts',
    io.encodeGocadTS(grid),
    'utf8',
)
