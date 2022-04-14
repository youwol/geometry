const fs   = require('fs')
const math = require('@youwol/math')
const df   = require('@youwol/dataframe')
const io   = require('@youwol/io')
const geom = require('../../dist/@youwol/geometry')

// Get the grid surface
//
const filename = '/Users/fmaerten/data/arch/galapagos-all/model2/forward-grid-13500.ts'
const grids    = io.decodeGocadTS( fs.readFileSync(filename, 'utf8') )
const grid     = io.merge(grids)

// let allLines = []

// grids.forEach( grid => {
//     // Get the vector attribute
//     //
//     const manager = new df.Manager(grid, [ new math.EigenVectorsDecomposer ])
//     const vectorAttribute = manager.serie(3, 'S2')

//     // Normalize the grid position
//     //
//     const normalizer = new geom.Normalizer( math.minMax(grid.series.positions), 0.1)
//     grid.series.positions = normalizer.normalize( grid.series.positions )
//     const bounds = math.minMax( grid.series.positions )

//     // Prepare the interpolator
//     //
//     const nx = 100
//     const ny = 100
//     const interpolator = new geom.InterpolateInGrid2D({
//         positions: grid.series.positions,
//         indices  : grid.series.indices,
//         attribute: vectorAttribute,
//         nx,
//         ny,
//         flatten: true,
//         scaling: 1
//     })

//     // Get two seed points, one for each sub-grid (Fernandina and the other)
//     //
//     // const p1 = normalizer.normalize([675400, 9958543, -500])
//     // const p2 = normalizer.normalize([699386, 9957051 , -500])
//     // const seeds = [
//     //     {x: p1[0], y: p1[1]},
//     //     {x: p2[0], y: p2[1]}
//     // ]

//     // Generate a random point in the bbox of the grid
//     // and check that is it inside the polygon
//     const borders = geom.extractSurfaceBorders(grid.series.positions, grid.series.indices)
//     const seed    = geom.generatePointInPolygon(borders, maxThrows=100)

//     // Extract the streamlines
//     //
//     let lines = geom.streamLinesExtractor({
//         vectorField: p => {
//             const v = interpolator.interpolate([p.x, p.y])
//             return v === undefined ? undefined : new geom.Vector(v[0], v[1])
//         },
//         dims: [nx, ny],
//         bounds,
//         maximumPointsPerLine: 200,
//         dSep: 0.1,
//         timeStep: 0.05,
//         dTest: 0.05,
//         // seed
//         // seedArray: seeds
//     })

//     // Denormalize the generated streamlines
//     //
//     lines.forEach( line => {
//         line.series.positions = normalizer.denormalize(line.series.positions)
//     })

//     allLines = [...allLines, ...lines]

//     console.log('Generated', lines.length, 'lines')
// })

// // Save...
// //
// fs.writeFileSync('/Users/fmaerten/data/arch/galapagos-all/model2/out/streamlines.pl', io.encodeGocadPL(allLines), 'utf8')






// Get the vector attribute
//
const manager = new df.Manager(grid, [ new math.EigenVectorsDecomposer ])
const vectorAttribute = manager.serie(3, 'S2')

// Normalize the grid position
//
const normalizer = new geom.Normalizer( math.minMax(grid.series.positions), 0.1)
grid.series.positions = normalizer.normalize( grid.series.positions )
const bounds = math.minMax( grid.series.positions )

// Prepare the interpolator
//
const nx = 100
const ny = 100
const interpolator = new geom.InterpolateInGrid2D({
    positions: grid.series.positions,
    indices  : grid.series.indices,
    attribute: vectorAttribute,
    nx,
    ny,
    flatten: true,
    scaling: 1
})

// Get two seed points, one for each sub-grid (Fernandina and the other)
//
const p1 = normalizer.normalize([675400, 9958543, -500])
const p2 = normalizer.normalize([699386, 9957051 , -500])
const seeds = [
    {x: p1[0], y: p1[1]},
    {x: p2[0], y: p2[1]}
]

// Extract the streamlines
//
let lines = geom.streamLinesExtractor({
    vectorField: p => {
        const v = interpolator.interpolate([p.x, p.y])
        return v === undefined ? undefined : new geom.Vector(v[0], v[1])
    },
    dims: [nx, ny],
    bounds,
    maximumPointsPerLine: 200,
    dSep: 0.1,
    timeStep: 0.05,
    dTest: 0.05, 
    seedArray: seeds
})

// Denormalize the generated streamlines
//
lines.forEach( line => {
    line.series.positions = normalizer.denormalize(line.series.positions)
})

console.log('Generated', lines.length, 'lines')

// Save...
//
fs.writeFileSync('/Users/fmaerten/data/arch/galapagos-all/model2/out/streamlines.pl', io.encodeGocadPL(lines), 'utf8')
