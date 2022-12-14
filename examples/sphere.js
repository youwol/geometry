const io = require('../../../../workspace/packages/io/dist/@youwol/io')
const df = require('../../../../workspace/packages/dataframe/dist/@youwol/dataframe')
const geom = require('../../../../workspace/packages/geometry/dist/@youwol/geometry')
const fs = require('fs')

const { positions, indices } = geom.generateSphere(10, {
    shared: false,
    typed: false,
})
const dataframe = df.DataFrame.create({
    series: {
        positions: df.Serie.create({ array: positions, itemSize: 3 }),
        indices: df.Serie.create({ array: indices, itemSize: 3 }),
    },
})
console.log(positions)
console.log(indices)
fs.writeFileSync(
    '/Users/fmaerten/data/mesh/sphere.ts',
    io.encodeGocadTS(dataframe),
    'utf8',
    () => {},
)
