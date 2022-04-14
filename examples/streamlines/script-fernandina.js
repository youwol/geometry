const fs   = require('fs')
const math = require('@youwol/math')
const df   = require('@youwol/dataframe')
const io   = require('@youwol/io')
const geom = require('../../dist/@youwol/geometry')

class Bounds {
    constructor(bounds, scaling = 1) {
        this.bounds = bounds
        this.width  = (bounds[3] - bounds[0])*scaling
        this.height = (bounds[4] - bounds[1])*scaling
        this.center = [(bounds[3]+bounds[0])/2, (bounds[4]+bounds[1])/2]
    }

    normalized() {
        return [
            (this.bounds[0]-this.center[0])/this.width,
            (this.bounds[1]-this.center[1])/this.height,
            this.bounds[2],
            (this.bounds[3]-this.center[0])/this.width,
            (this.bounds[4]-this.center[1])/this.height,
            this.bounds[5]
        ]
    }

    denormalize(polylines /* DataFrame[] */) {
        polylines.forEach( polyline => {
            console.log(polyline.series.positions)
            polyline.series.positions = polyline.series.positions.map( p => {
                const x = p[0]*this.width  + this.center[0]
                const y = p[1]*this.height + this.center[1]
                return [x, y, 0]
            })
        })
    }
}

const filename = '/Users/fmaerten/data/arch/fernandina/out/result-grid-4.xyz'
const grid     = io.decodeXYZ( fs.readFileSync(filename, 'utf8') )[0]

// const manager = new df.Manager(grid, [ new math.EigenVectorsDecomposer ])
// manager.serie(3, 'S2')

const b = new Bounds( math.minMax(grid.series.positions), 0.1 )
const bounds = b.normalized()

const gridHelper = new geom.Grid2DHelper([bounds[0],bounds[1]], [bounds[3],bounds[4]], 50, 50, 1e-7)

let lines = geom.streamLinesExtractor({
    vectorField: p => {
        const v = gridHelper.interpolate([p.y, p.x], grid.series.Joint) // WARNING: WE INVERTED  the x and y !
        if (v === undefined) return undefined
        return new geom.Vector(v[0], v[1])
    },
    dims  : geom.getDimsGrid2D(grid.series.positions),
    bounds,
    maximumPointsPerLine: 50
})

b.denormalize(lines)

fs.writeFileSync('/Users/fmaerten/data/arch/fernandina/out/streamlines.pl', io.encodeGocadPL(lines), 'utf8')
