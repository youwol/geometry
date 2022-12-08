import { Facet, Surface } from '../he'
import { Serie } from '@youwol/dataframe'

/**
 * Linear interpolate any Serie of any itemSize from triangle to nodes using topological
 * information.
 * @category dataframe
 */
export function fromTriangleToNode({
    positions,
    indices,
    serie,
}: {
    positions: Serie
    indices: Serie
    serie: Serie
}): Serie {
    const surface = Surface.create(positions, indices)

    if (serie.count !== surface.nbFacets) {
        throw new Error(
            `serie must be defined at triangles (count=${surface.nbFacets}). Got count=${serie.itemSize}`,
        )
    }

    // Linear-interpolate displ from triangles to vertices
    const size = serie.itemSize

    const b = serie.newInstance({ count: surface.nbNodes, itemSize: size })
    let array = b.array
    const weights = new Array(surface.nbNodes).fill(0)

    // array = array.map( _ => 0 )

    surface.forEachFace((face: Facet, i: number) => {
        const ids = face.nodeIds
        let d = serie.itemAt(i)

        for (let j = 0; j < 3; ++j) {
            // nodes of triangle
            const id = ids[j]
            if (size === 1) {
                array[id] += d as number
            } else {
                for (let k = 0; k < size; ++k) {
                    array[size * id + k] += d[k]
                }
            }
            weights[id]++
        }
    })

    for (let i = 0, k = 0; i < array.length; i += size, ++k) {
        for (let j = 0; j < size; ++j) {
            array[i + j] /= weights[k]
        }
    }

    return Serie.create({ array, itemSize: size })
}
