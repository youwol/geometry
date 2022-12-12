import { Facet } from './combels'
import { vec } from '@youwol/math'

/**
 * @category Halfedge
 */
export function triangleArea(v1: number[], v2: number[], v3: number[]) {
    return (
        vec.norm(
            vec.cross(
                vec.create(v1, v2) as vec.Vector3,
                vec.create(v1, v3) as vec.Vector3,
            ),
        ) * 0.5
    )
}

export function triangleNormal(v1: number[], v2: number[], v3: number[]) {
    const V = vec.create(v3, v2) as vec.Vector3
    const W = vec.create(v1, v2) as vec.Vector3
    //console.log(v1, v2, v3, vec.cross(V, W))
    return vec.normalize(vec.cross(V, W))
    // return vec.normalize( vec.cross( vec.create(v1,v2) as vec.Vector3, vec.create(v1,v3) as vec.Vector3 ) )
}

/**
 * @see Facet.area
 *
 * @category Halfedge
 */
export function facetArea(f: Facet): number {
    let result = 0
    let h = f.halfedge
    const p = h.node.pos
    h = h.next

    do {
        result += triangleArea(p, h.node.pos, h.next.node.pos)
        h = h.next
    } while (h !== f.halfedge)

    return result
}

/**
 * @see Facet.area
 *
 * @category Halfedge
 */
export function facetNormal(f: Facet): vec.Vector3 {
    let result = [0, 0, 0] as vec.Vector3

    let h = f.halfedge
    const p = h.node.pos
    h = h.next

    do {
        const r = triangleNormal(p, h.node.pos, h.next.node.pos)
        if (!Number.isNaN(r[0])) {
            result = vec.add(result, r) as vec.Vector3
        }
        h = h.next
    } while (h !== f.halfedge)

    return vec.normalize(result) as vec.Vector3
}
