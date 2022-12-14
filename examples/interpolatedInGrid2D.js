const io = require('../../io/dist/@youwol/io')
const geom = require('../dist/@youwol/geometry')
const fs = require('fs')

// ---------------------------------------------------------

const dataframe = io.decodeGocadTS(
    fs.readFileSync('/Users/fmaerten/data/arch/S1/S1.ts', 'utf8'),
)[0]
// create a vector attribute
dataframe.series['U'] = dataframe.series.positions.map((p) => p)

const attribute = dataframe.series.U

const inter = new geom.InterpolateInGrid2D({
    positions: dataframe.series.positions,
    indices: dataframe.series.indices,
    attribute: attribute,
    nx: 100,
    ny: 100,
    flatten: true,
})

// ---------------------------------------------------------

let buffer = '# x y z '
for (let k = 0; k < attribute.itemSize; ++k) {
    buffer += `U${k} `
}
buffer += '\n'

inter.backgroundGrid.forAllPoints((sol, i, j, p) => {
    const v = inter.interpolate(p)
    if (v) {
        if (Array.isArray(v)) {
            buffer += `${p[0]} ${p[1]} 0 `
            v.forEach((q) => (buffer += q + ' '))
            buffer += '\n'
        } else {
            buffer += `${p[0]} ${p[1]} 0 ${v}\n`
        }
    } else {
        buffer += `${p[0]} ${p[1]} 0 `
        for (let k = 0; k < attribute.itemSize; ++k) {
            buffer += '0 '
        }
        buffer += '\n'
    }
})

fs.writeFile(
    '/Users/fmaerten/data/streamlines/interpolated.xyz',
    buffer,
    'utf8',
    () => {},
)
