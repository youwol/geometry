import { Serie } from '@youwol/dataframe'
import { fromNodeToTriangle, fromTriangleToNode, InterpolateSerieFromCsysOnSurface } from '../lib'


test('test interpolate serie on surface', () => {
    const positions = [0,0,0, 1,0,0, 1,1,0, 0,1,0]
    const indices   = [0,1,2, 0,2,3]
    const u         = Serie.create({array: [1,3,7, 2,4,9], itemSize: 3})

    const i = new InterpolateSerieFromCsysOnSurface(positions, indices)
    // console.log( i.interpolate({serie: u, atTriangles: true, localCsys: true}) )

    // Test to be done...
    expect(false).toBeFalsy()
})

test('test from triangle to node', () => {
    const positions = Serie.create({array: [0,0,0, 1,0,0, 1,1,0, 0,1,0], itemSize: 3})
    const indices   = Serie.create({array: [0,1,2, 0,2,3], itemSize: 3})
    const u         = Serie.create({array: [1,3,7, 2,4,9], itemSize: 3})

    const s = fromTriangleToNode({positions, indices, serie: u})

    // Test to be done...
    const sol = [1.5, 3.5, 8,   1, 3, 7,    1.5, 3.5, 8,   2, 4, 9]
    s.array.forEach( (v,i) => expect(v).toEqual(sol[i]) )
})

test('test from node to triangle', () => {
    const positions = Serie.create({array: [0,0,0, 1,0,0, 1,1,0, 0,1,0], itemSize: 3})
    const indices   = Serie.create({array: [0,1,2, 0,2,3], itemSize: 3})
    const u         = Serie.create({array: [1,2,3, 4,5,6, 7,8,9, 10, 11, 12], itemSize: 3})

    const s = fromNodeToTriangle({positions, indices, serie: u})

    // Test to be done...
    const sol = [(1+4+7)/3, (2+5+8)/3, (3+6+9)/3,   (1+7+10)/3, (2+8+11)/3, (3+9+12)/3]
    console.log(sol)
    console.log(s.array)
    s.array.forEach( (v,i) => expect(v).toEqual(sol[i]) )
})
