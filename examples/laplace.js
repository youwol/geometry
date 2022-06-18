const io   = require('../../../../workspace/packages/io/dist/@youwol/io')
const geom = require('../../../../workspace/packages/geometry/dist/@youwol/geometry')
const math = require('../../../../workspace/packages/math/dist/@youwol/math')
const fs   = require('fs')

const dataframe = io.decodeGocadTS( fs.readFileSync('/Users/fmaerten/data/mesh/S1.ts', 'utf8') )[0]

const laplace = new geom.HarmonicDiffusion(dataframe.series.positions, dataframe.series.indices, [0,0,0])
laplace.constrainsBorders([-1, -2, -3])
laplace.addConstrainedNode([-800,-300,-800], [3,2,1])
laplace.addConstrainedNode([0,-300,800], [1,3,5])

dataframe.series['P'] = laplace.solve()

console.log(dataframe.series.P)

fs.writeFileSync('/Users/fmaerten/data/mesh/laplace.ts', io.encodeGocadTS(dataframe), 'utf8', err => {})
