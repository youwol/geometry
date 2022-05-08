import { Serie } from '@youwol/dataframe'
import { Surface } from '../lib'

const vertices = Serie.create({array: [
    0, 0, 0,
    1, 0, 0,
    2, 0, 0,
    3, 0, 0,
    0, 1, 0,
    1, 1, 0,
    2, 1, 0,
    3, 1, 0,
    0, 2, 0,
    1, 2, 0,
    2, 2, 0,
    3, 2, 0,
    0, 3, 0,
    1, 3, 0,
    2, 3, 0,
    3, 3, 0
], itemSize: 3})

const triangles = Serie.create({array: [
    0, 1, 5,
    0, 5, 4,
    1, 2, 6,
    1, 6, 5,
    2, 3, 7,
    2, 7, 6,
    4, 5, 9,
    4, 9, 8,
    //5, 6, 10,
    5, 10, 9,
    6, 7, 11,
    6, 11, 10,
    8, 9, 13,
    8, 13, 12,
    9, 10, 14,
    9, 14, 13,
    10, 11, 15,
    10, 15, 14
], itemSize: 3})

/*

o-o-o-o
|/|/|/|
o-o-o-o
|/|/|/| <-- lower middle triangle is void
o-o-o-o
|/|/|/|
o-o-o-o

*/

test('half-edge test', () => {
    const surface = Surface.create(vertices, triangles)

    const r = [1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1]
    surface.forEachNode( (n,i) => {
        expect(n.isOnBorder).toEqual(r[i]===1?true:false)
    })

    const edges = surface.borderEdges
    // edges.forEach( e => console.log(e.node.id, e.opposite.node.id))

    // console.log( surface.bordersAsSerie )
    // console.log( surface.borderIdsAsSerie )

    // Test to be done...
    expect(false).toBeFalsy()
})
