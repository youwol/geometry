import { createFrom, Serie } from '@youwol/dataframe'
import { vec } from '@youwol/math'
import { Facet, Surface } from './he'
import { TriangleCSys } from './plane'

type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

/**
 * For a given triangulated surface where a serie is defined at the triangles and localy, allows to interpolation
 * this serie at nodes (or not) and globaly (or not).
 *
 * The local coordinate system is the one defoned in Arch (see Arch documentation), i.e., the Okada local
 * coordinate system.
 *
 * @example
 * ```js
 * const arch = require('@youwol/arch')
 * const geom = require('@youwol/geometry')
 *
 * // Given a serie defined in local coordinate system
 * // and at triangles...
 * //
 * const solution = new arch.Solution(model)
 * const burgers  = solution.burgers(true, true)
 *
 * // ...get a new serie defined at nodes and globally
 * //
 * const i = new InterpolateSerieOnSurface(positions, indices)
 * const newSerie = i.interpolate({
 *      serie      : burgers,
 *      atTriangles: false,
 *      localCsys  : false
 * })
 * ```
 */
export class InterpolateSerieFromCsysOnSurface {
    surface: Surface = undefined

    constructor(
        positions: Serie | TypedArray | number[],
        indices: Serie | TypedArray | number[],
    ) {
        this.surface = Surface.create(positions, indices)
    }

    // setAxisOrder (x: string, y: string, z: string) {
    // }

    // setAxisRevert(x: boolean, y: boolean, z: boolean) {
    // }

    /**
     * serie must be defined at triangles and only (for the moment) with itemSize = 3
     */
    interpolate({
        serie,
        atTriangles = false,
        localCsys = true,
    }: {
        serie: Serie
        atTriangles?: boolean
        localCsys: boolean
    }): Serie {
        if (serie.itemSize !== 3) {
            throw new Error(
                'For the moment, only series with itemSize = 3 is allowed',
            )
        }
        if (serie.count !== this.surface.nbFacets) {
            throw new Error(
                `serie must be either defined at triangles (count=${this.surface.nbFacets}). Got count=${serie.itemSize}`,
            )
        }

        if (atTriangles == true) {
            // no interpolation
            // const b = serie.newInstance({count: serie.count, itemSize: 3})
            const b = serie.image(serie.count, 3)
            const array = b.array

            let id = 0
            this.surface.forEachFace((face: Facet, i: number) => {
                let v = serie.itemAt(i) as vec.Vector3
                if (localCsys === false) {
                    const t = new TriangleCSys(face.normal)
                    v = t.toGlobal(v)
                }
                array[id++] = v[0]
                array[id++] = v[1]
                array[id++] = v[2]
            })

            return b
        } else {
            // Linear-interpolate displ from triangles to vertices
            // const b = serie.newInstance({count: this.surface.nbNodes, itemSize: 3})
            const b = serie.image(this.surface.nbNodes, 3)
            const array = b.array

            const values: vec.Vector3[] = new Array(this.surface.nbNodes).fill([
                0, 0, 0,
            ])
            const weights: number[] = new Array(this.surface.nbNodes).fill(0)

            this.surface.forEachFace((face: Facet, i: number) => {
                const ids = face.nodeIds
                let d = serie.itemAt(i) as vec.Vector3

                if (localCsys === false) {
                    const t = new TriangleCSys(face.normal)
                    d = t.toGlobal(d)
                }

                for (let j = 0; j < 3; ++j) {
                    for (let k = 0; k < 3; ++k) {
                        values[ids[j]][k] += d[k]
                    }
                    weights[ids[j]]++
                }
                for (let j = 0; j < this.surface.nbNodes; ++j) {
                    const w = weights[j]
                    for (let k = 0; k < 3; ++k) {
                        values[j][k] /= w
                    }
                }
            })

            let id = 0
            values.forEach((v) => {
                array[id++] = v[0]
                array[id++] = v[1]
                array[id++] = v[2]
            })

            return b
        }
    }
}
