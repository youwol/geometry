import { createEmptySerie } from '@youwol/dataframe'
import { vec } from '@youwol/math'
import { Surface } from '../he'
import { fromTriangleToNode } from './fromTriangleToNode'

export function generateNormals(dataframe, atNode = true) {
    const surface = Surface.create(
        dataframe.series.positions,
        dataframe.series.indices,
    )

    const n = createEmptySerie({
        Type: Array,
        count: surface.nbFacets,
        itemSize: 3,
        shared: false,
    })

    surface.forEachFace((face, i) => {
        const ids = face.nodeIds
        const p1 = surface.nodes[ids[0]].pos
        const p2 = surface.nodes[ids[1]].pos
        const p3 = surface.nodes[ids[2]].pos
        const v1 = vector(p1, p2) as vec.Vector3
        const v2 = vector(p1, p3) as vec.Vector3
        n.setItemAt(i, vec.cross(v1, v2))
    })

    if (atNode === true) {
        return fromTriangleToNode({
            positions: dataframe.series.positions,
            indices: dataframe.series.indices,
            serie: n,
        })
    }

    return n
}

const vector = (p1: vec.Vector3, p2: vec.Vector3) => {
    const x = p2[0] - p1[0]
    const y = p2[1] - p1[1]
    const z = p2[2] - p1[2]
    const n = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
    return [x / n, y / n, z / n]
}
