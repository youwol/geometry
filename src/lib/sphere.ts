// From https://observablehq.com/@mbostock/geodesic-rainbow
//

import { createTyped } from "@youwol/dataframe"

/**
 * Return two typed array for the faces and the vertices making a sphere given by a subdivision.
 * Note that all triangles are decoupled.
 * ```ts
 * {
 *      position: Float32Array,
 *      indices : Int16Array
 * }
 * ```
 * @example
 * ```ts
 * import { sphere } from '@youwol/geometry
 * const {positions, indices} = sphere(10)
 * ```
 * @param subdivision The number of subdivision (>0)
 */
 export function sphere(subdivision: number) {
     if (subdivision<1) throw new Error('Subdivision must be > 0')

    const phi       = (1+Math.sqrt(5))/2 // golden number
    const positions = new Array<number>()
    const indices   = new Array<number>()
    let   idx       = 0

    const vertices = [
        [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
        [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
        [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
    ]
    
    const faces = [
        [0,1,4],  [1,9,4],  [4,9,5],  [5,9,3],  [2,3,7],
        [3,2,5],  [7,10,2], [0,8,10], [0,4,8],  [8,2,10],
        [8,4,5],  [8,5,2],  [1,0,6],  [11,1,6], [3,9,11],
        [6,10,7], [3,11,7], [11,6,7], [6,0,10], [9,1,11]
    ].map(face => face.map(i => vertices[i]))

    const project = ([x,y,z]: number[]) => {
        const R = 3
        const k = R/Math.sqrt(x**2 + y**2 + z**2)
        return [k*x, k*y, k*z]
    }

    const interpolate = ([x0, y0, z0]: number[], [x1, y1, z1]: number[], t: number) => [
        x0 + t * (x1 - x0),
        y0 + t * (y1 - y0),
        z0 + t * (z1 - z0)
    ]

    const newP = (...P: number[][]): void => 
        P.forEach( (p: number[]) => {
            positions.push(p[0], p[1], p[2])
            indices.push(idx++, idx++, idx++)
        })

    for (const [f0, f1, f2] of faces) {
        let f10, f20 = interpolate(f0, f1, 1 / subdivision)
        let f11, f21 = interpolate(f0, f2, 1 / subdivision)
        newP(
            project(f0), 
            project(f20), 
            project(f21)
        )
        for (let i = 1; i < subdivision; ++i) {
            f10 = f20, f20 = interpolate(f0, f1, (i + 1) / subdivision)
            f11 = f21, f21 = interpolate(f0, f2, (i + 1) / subdivision)
            for (let j = 0; j <= i; ++j) {
                newP(
                    project(interpolate(f10, f11, j / i)),
                    project(interpolate(f20, f21, j / (i + 1))),
                    project(interpolate(f20, f21, (j + 1) / (i + 1)))
                )
            }
            for (let j = 0; j < i; ++j) {
                newP(
                    project(interpolate(f10, f11, j / i)),
                    project(interpolate(f20, f21, (j + 1) / (i + 1))),
                    project(interpolate(f10, f11, (j + 1) / i))
                )
            }
        }
    }

    return {
        positions: createTyped(Float32Array, positions, true),
        indices:   createTyped(Int16Array, indices, true)
    }
}
