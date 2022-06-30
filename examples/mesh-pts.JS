const io   = require('../../io/dist/@youwol/io')
const geom = require('../dist/@youwol/geometry')
const fs   = require('fs')

// const input  = '/Users/fmaerten/data/meca/kogan.xyz'
// const output = '/Users/fmaerten/data/meca/kogan.ts'
const input  = 'pts.xyz'
const output = '/Users/fmaerten/data/mesh/pts.ts'


const dataframe       = io.decodeXYZ( fs.readFileSync(input, 'utf8') )[0]
const {point, normal} = geom.fittingPlane(dataframe.series.positions)
const newDataframe    = geom.triangulate(dataframe.series.positions, normal)

fs.writeFile(output, io.encodeGocadTS(newDataframe), 'utf8', err => {})
