const io = require('../../../../workspace/packages/io/dist/@youwol/io')
const geom = require('../../../../workspace/packages/geometry/dist/@youwol/geometry')
const fs = require('fs')

// let dataframe = io.decodeGocadTS( fs.readFileSync('/Users/fmaerten/data/mesh/S1.ts', 'utf8') )[0]
let dataframe = geom.generateRectangle({ a: 20, b: 15, na: 50, nb: 50 })

const laplace = new geom.HarmonicDiffusion(
    dataframe.series.positions,
    dataframe.series.indices,
    0,
)
// laplace.constrainsBorders(0)
laplace.addConstraint([0, 0, 0], 3)
laplace.addConstraint([-5, -5, 0], -3)
laplace.epsilon = 0.6
laplace.eps = 1e-7
laplace.maxIter = 5000

// dataframe.series['P'] = laplace.solve({record: true})

dataframe = laplace.solve({
    name: 'P',
    record: true,
    step: 100
})

fs.writeFileSync(
    '/Users/fmaerten/data/mesh/laplace.ts',
    io.encodeGocadTS(dataframe),
    'utf8',
    () => {},
)
