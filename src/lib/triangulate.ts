import { ASerie, createSerie, createTyped, DataFrame } from '@youwol/dataframe'
import { Vector3 } from '@youwol/math'
import { Delaunator } from './delaunay/delaunator'
import { project } from './plane'

/**
 * Unconstrained Delaunay triangulation in 2D.
 * @param points The point coordinates as a packed array
 * @param normal The normal to project th epoint to perform the triangulation
 */
export function triangulate(points: ASerie, normal: Vector3 = [0,0,1]): DataFrame {
    let d: Delaunator = undefined

    if (points.itemSize===2) {
        d  = new Delaunator(points.array)
    } else {
        const plane = {normal, point: [0,0,0] as Vector3}
        d = new Delaunator(points.map( p => project(p, plane) ) )
    }

    return new DataFrame({
        columns: {
            positions: points,
            indices: createSerie({
                data    : createTyped(Float32Array, d.triangles, true),
                itemSize: 3
            })
        }
    })
}
