const fs   = require('fs')
const math = require('@youwol/math')
const df   = require('@youwol/dataframe')
const io   = require('@youwol/io')
const geom = require('../../dist/@youwol/geometry')

const filename = '/Users/fmaerten/data/arch/fernandina/out/result-grid-4.xyz'
const grid     = io.decodeXYZ( fs.readFileSync(filename, 'utf8') )[0]

const manager = new df.Manager(grid, [
    new math.EigenVectorsDecomposer // S1 S2 S3
])

const lines = geom.streamLinesExtractor({
    vectorField: grid.series.Joint,
    // vectorField: manager.serie(3, 'S2'),
    positions  : grid.series.positions,
    maximumPointsPerLine: 50
})

fs.writeFileSync('/Users/fmaerten/data/arch/fernandina/out/streamlines.pl', io.encodeGocadPL(lines), 'utf8')
