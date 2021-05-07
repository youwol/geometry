import { ASerie, createSerie, createTyped, DataFrame, array } from '@youwol/dataframe'
import { Vector3 } from '@youwol/math'
import { Delaunator } from './delaunay/delaunator'
import { project } from './plane'

/**
 * Unconstrained Delaunay triangulation in 2D.
 * @param points The point coordinates as a packed array
 * @param normal The normal to project th epoint to perform the triangulation
 * @license ISC
 * @copyright 2017, Mapbox
 * @github [This link](https://github.com/mapbox/delaunator)
 */
export function triangulate(positions: ASerie, normal: Vector3 = [0,0,1]): DataFrame {
    let d: Delaunator = undefined

    if (positions.itemSize===2) {
        d  = new Delaunator(positions.array)
    } else {
        const newPts = positions.map( p => project(p, {normal, point: [0,0,0] as Vector3}) )
        d = new Delaunator( newPts.array )
    }

    const max = array.max(d.triangles)
    // let indices: ASerie = undefined
    // if (max>65535) {
    //     indices = createSerie({data: createTyped(Uint32Array, d.triangles, true), itemSize: 3})
    // }
    // else {
    //     indices = createSerie({data: createTyped(Uint16Array, d.triangles, true), itemSize: 3})
    // }
    const indices = createSerie({data: d.triangles, itemSize: 3})

    const df = new DataFrame({
        indices,
        positions
    })

    return df
}
