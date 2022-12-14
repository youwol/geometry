import { Serie } from '@youwol/dataframe'
import { minMax } from '@youwol/math'
import { BBox } from './bbox'

// type Point2d = [number, number]

/**
 * If the polygon is given by 3D points, set the flag `hasZ` to true.
 * The z component will be discarded.
 *
 * Usage:
 * ```js
 * const polygon = [1, 1,  1, 2,  2, 2,  2, 1]
 * console.log( pointInPolygon(1.5, 1.5, polygon)) // true
 * console.log( pointInPolygon(4.9, 1.2, polygon)) // false
 * console.log( pointInPolygon(1.8, 1.1, polygon)) // true
 * ```
 * @note based on https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
 */
// export function pointInPolygon(testx: number, testy: number, verts: number[], hasZ = false) {
//     let c = false
//     const shift = hasZ ? 3: 2

//     if (verts.length%shift !== 0) {
//         throw new Error('bad verts array length in '+(hasZ?'3D':'2D'))
//     }

//     const nvert = verts.length / shift
//     for (let i = 0, j = nvert - 1; i < nvert; j = i++) {
//         const xi = verts[shift * i]
//         const yi = verts[shift * i + 1]
//         const yj = verts[shift * j + 1]
//         if (((yi > testy) != (yj > testy)) && (testx < (verts[shift * j] - xi) * (testy - yi) / (yj - yi) + xi)) {
//             c = !c
//         }
//     }
//     return c
// }

export function pointInPolygon(x: number, y: number, polyline: Serie): boolean {
    let c = false

    if (polyline.itemSize !== 2 && polyline.itemSize !== 3) {
        throw new Error('bad Serie for polyline. Should be coords in 2D or 3D')
    }

    const shift = polyline.itemSize
    const nvert = polyline.count
    const verts = polyline.array
    for (let i = 0, j = nvert - 1; i < nvert; j = i++) {
        const xi = verts[shift * i]
        const yi = verts[shift * i + 1]
        const yj = verts[shift * j + 1]
        if (
            yi > y != yj > y &&
            x < ((verts[shift * j] - xi) * (y - yi)) / (yj - yi) + xi
        ) {
            c = !c
        }
    }
    return c
}

export function generatePointInPolygon(
    polyline: Serie,
    maxThrows = 100,
): [number, number] {
    const bounds = minMax(polyline)
    const bbox = new BBox(
        [bounds[0], bounds[1], polyline.itemSize === 3 ? bounds[2] : 0],
        [bounds[3], bounds[4], polyline.itemSize === 3 ? bounds[5] : 0],
    )
    let i = 0

    /*eslint no-constant-condition: off -- stupid, so disablethis eslint error*/
    while (true) {
        const p = bbox.randPoint()
        if (pointInPolygon(p[0], p[1], polyline)) {
            return [p[0], p[1]]
        }
        if (i > maxThrows) {
            return undefined
        }
        i++
    }
}
