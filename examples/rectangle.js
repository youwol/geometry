const io = require('../../../../workspace/packages/io/dist/@youwol/io')
const geom = require('../../../../workspace/packages/geometry/dist/@youwol/geometry')
const fs = require('fs')

const dataframe = geom.generateRectangle({
    a: 100,
    b: 100,
    na: 11,
    nb: 11,
    center: [0, 0, -10],
})

fs.writeFileSync(
    '/Users/fmaerten/data/mesh/rectangle.ts',
    io.encodeGocadTS(dataframe),
    'utf8',
    (err) => {},
)
