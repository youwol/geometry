import { Serie } from '@youwol/dataframe'
import { reverseNormals, Surface } from '../lib'

let vertices = Serie.create({
    array: [0, 0, 0, 1, 0, 0, 1, 1, 0],
    itemSize: 3,
}) as Serie
let triangles = Serie.create({ array: [0, 1, 2], itemSize: 3 }) as Serie

test('reverse-normals test', () => {
    const surface = {
        vertices,
        indices: triangles,
    }

    surface.indices = reverseNormals(surface.indices)

    expect(surface.indices.itemAt(0)[0]).toEqual(0)
    expect(surface.indices.itemAt(0)[1]).toEqual(2)
    expect(surface.indices.itemAt(0)[2]).toEqual(1)
})
