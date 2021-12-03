const df   =  require("@youwol/dataframe")
const io   =  require("../../io/dist/@youwol/io")
const math =  require("@youwol/math")
const geom = require('../dist/@youwol/geometry')
const fs   = require('fs')
const { exit } = require("process")

const n = 10000

let buffer    = fs.readFileSync('/Users/fmaerten/data/arch/S1/S1.ts', 'utf8')
const S1 = io.decodeGocadTS(buffer)[0]

function generateMesh() {
    // let serie = df.Serie.create({
    //     array: new Array(3*n).fill(0).map( _ => Math.random()-0.5),
    //     itemSize: 3
    // })
    // serie = serie.map (p => [p[0], p[1], 0])
    // return geom.triangulate(serie)
    return S1
}

const dataframe = generateMesh()
dataframe.series.positions = dataframe.series.positions.map( p => [p[0], p[1], 0] )
dataframe.series['U'] = math.normalize( dataframe.series.positions.map( (p, i) => [p[1], -p[0], 0] ) )

const bg = geom.createBackgroundGrid2D({
    position: dataframe.series.positions,
    indices : dataframe.series.indices,
    dims: [100, 100]
})

const bbox = bg.bbox

buffer = io.encodeGocadTS(dataframe)
fs.writeFile('/Users/fmaerten/data/arch/S1/flat-S1.ts', buffer, 'utf8', err => {})

function check(p) {
    console.log('checking', p)
    let sol = bg.candidates(p)
    if (sol && sol.length) {

        const unity = coord => coord>=0 && coord<=1
        const inTriangle = (p, p1, p2, p3) => {
            const w = math.barycentric2(p, p1, p2, p3)
            return unity(w[0]) && unity(w[1]) && unity(w[2])
        }

        sol.forEach( s => {
            const index = s.obj
            const cell = dataframe.series.indices.itemAt(index)
            const p1 = dataframe.series.positions.itemAt(cell[0])
            const p2 = dataframe.series.positions.itemAt(cell[1])
            const p3 = dataframe.series.positions.itemAt(cell[2])
            if (inTriangle(p, p1, p2, p3)) {
                const q1 = dataframe.series.U.itemAt(cell[0])
                const q2 = dataframe.series.U.itemAt(cell[1])
                const q3 = dataframe.series.U.itemAt(cell[2])
                const v = math.triangleLerp2D(
                    [p[0],p[1]], 
                    [p1[0],p1[1]], [p2[0],p2[1]], [p3[0],p3[1]],
                    q1, q2, q3
                )
                //console.log(p1, '\n', p2, '\n', p3, '\n', q1,'\n', q2,'\n', q3,'\n', v, '\n')
                console.log(v)
            }
        })
    }
}

/*
BBOX
    x: -1703.1099755859375,
    y: -1784.060048828125,
    width : 3119.5599169921875,
    height: 3287.1700244140625
*/
const generate = () => [bbox.x + Math.random()*bbox.width, bbox.y + Math.random()*bbox.height]
check(generate())
