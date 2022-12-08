import { Facet, Surface } from '../he'
import { Serie } from '@youwol/dataframe'

/**
 * Linear interpolate any Serie of any itemSize from nodes to triangles using topological
 * information.
 * @category dataframe
 */
export function fromNodeToTriangle({
    positions,
    indices,
    serie,
}: {
    positions: Serie
    indices: Serie
    serie: Serie
}): Serie {
    const surface = Surface.create(positions, indices)

    if (serie.count !== surface.nbNodes) {
        throw new Error(
            `serie must be defined at nodes (count=${surface.nbNodes}). Got count=${serie.itemSize}`,
        )
    }

    // Linear-interpolate displ from triangles to vertices
    const size = serie.itemSize
    const b = serie.newInstance({ count: surface.nbFacets, itemSize: size })
    let array = b.array

    surface.forEachFace((face: Facet, i: number) => {
        const ids = face.nodeIds

        for (let j = 0; j < 3; ++j) {
            // nodes of triangle
            const d = serie.itemAt(ids[j])

            if (size === 1) {
                array[i] += d as number
            } else {
                for (let k = 0; k < size; ++k) {
                    array[size * i + k] += d[k]
                }
            }
        }
    })

    for (let i = 0; i < array.length; ++i) {
        array[i] /= 3
    }

    return Serie.create({ array, itemSize: size })
}
