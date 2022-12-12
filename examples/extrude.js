const io = require('../../../../workspace/packages/io/dist/@youwol/io')
const geom = require('../../../../workspace/packages/geometry/dist/@youwol/geometry')
const df = require('../../../../workspace/packages/dataframe/dist/@youwol/dataframe')
const fs = require('fs')

const trace = {
    is: '1',
    dip: 35,
    dipDirection: 135,
    depth: 1000,
    numberRows: 5,

    points: df.Serie.create({
        array: [0, 0, 0, 1, 0, 2, 1, 3, 2, 4],
        itemSize: 2,
    }),
}
const surface = geom.extrude(trace)

const dataframe = df.DataFrame.create({
    series: {
        positions: surface.positions,
        indices: surface.indices,
    },
})

fs.writeFileSync(
    'extruded.gcd',
    io.encodeGocadTS(dataframe),
    'utf8',
    (err) => {},
)
