import { Serie } from '@youwol/dataframe'
import { reverseNormals } from '../lib'

const vertices = Serie.create({
    array: [0, 0, 0, 1, 0, 0, 1, 1, 0],
    itemSize: 3,
}) as Serie
const triangles = Serie.create({ array: [0, 1, 2], itemSize: 3 }) as Serie

test('reverse-normals test', () => {
    const surface = {
        vertices,
        indices: triangles,
    }

    surface.indices = reverseNormals(surface.indices)

    expect(surface.indices.itemAt(0)[0]).toBe(0)
    expect(surface.indices.itemAt(0)[1]).toBe(2)
    expect(surface.indices.itemAt(0)[2]).toBe(1)
})
