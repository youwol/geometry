import { biLerp } from '@youwol/math'
import { Serie } from '@youwol/dataframe'

export type V2 = [number, number]

/**
 * Represent a 2D cartesian grid (axis aligned)
 */
export class Grid2DHelper {
    private _origin = [0, 0]
    private _n = [0, 0]
    private _dx = 0
    private _dy = 0

    constructor(min: V2, max: V2, nx: number, ny: number, eps = 1e-7) {
        this._n = [nx, ny]
        this._dx = (max[0] - min[0] + 2 * eps) / (nx - 1)
        this._dy = (max[1] - min[1] + 2 * eps) / (ny - 1)
        this._origin = [min[0] - eps, min[1] - eps]
    }

    get count() {
        return this._n[0] * this._n[1]
    }
    get nx() {
        return this._n[0]
    }
    get ny() {
        return this._n[1]
    }
    get dx() {
        return this._dx
    }
    get dy() {
        return this._dy
    }
    get origin() {
        return this._origin
    }
    get xLength() {
        return this._n[0] * this._dx
    }
    get yLength() {
        return this._n[1] * this._dy
    }

    getIJ(p: [number, number]): { ok: boolean; ij?: number[] } {
        const lx = p[0] - this._origin[0]
        const xg = lx / this._dx
        if (lx < 0 || xg > this._n[0]) {
            return { ok: false }
        }
        const ix = Math.trunc(xg)

        const ly = p[1] - this._origin[1]
        const yg = ly / this._dy
        if (ly < 0 || yg > this._n[1]) {
            return { ok: false }
        }
        const iy = Math.trunc(yg)

        return {
            ok: true,
            ij: [ix, iy],
        }
    }

    /**
     * Given the (i,j) indices of a cell, return its flatten index.
     * This index varies from 0 to nx*ny and is unique for each corner
     * cell of the grid. It is mainly used to get the attribute at a given
     * position.
     */
    flatIndex(i: number, j: number): number {
        return i + j * this._n[0]
    }

    /**
     * Return the flat-indices of the 4 corners of the intersecting cell
     * with point p
     */
    flatIndices(p: [number, number]): [number, number, number, number] {
        const c = this.candidate(p)
        if (c === undefined) {
            return undefined
        }
        const i1 = this.flatIndex(c[0], c[1])
        const i2 = this.flatIndex(c[0], c[1] + 1)
        return [i1, i2, i1 + 1, i2 + 1]
    }

    /**
     * Given the (i,j) indices of a cell (lower-left corner),
     * return its (x,y) position
     */
    positionAt(i: number, j: number): [number, number] {
        const x = this._origin[0] + i * this._dx
        const y = this._origin[1] + j * this._dy
        return [x, y]
    }

    /**
     * Get the (i,j) position of the intersecting cell.
     * The 4 corners will be
     * ```
     * (i,j), (i+1,j), (i+1,j+1) and (i,j+1)
     *
     *       y
     *       ^
     *       |
     *       *---* (i+1,j+1)
     *       |   |
     * (i,j) *---* --> x
     * ```
     */
    candidate(p: [number, number]): [number, number] {
        const { ok, ij } = this.getIJ(p)
        if (!ok) {
            return undefined
        }
        return ij as [number, number]
    }

    interpolate(p: [number, number], attribute: Serie) {
        const ij = this.getIJ(p)
        if (ij.ok) {
            const I = ij.ij[0]
            const J = ij.ij[1]
            const p1 = this.positionAt(I, J)
            const p2 = this.positionAt(I + 1, J + 1)
            const ids = this.flatIndices(p)
            // console.log(attribute)
            const values = ids.map((v) => attribute.itemAt(v))
            if (Array.isArray(values[0])) {
                return values[0].map((a1, i) => {
                    return biLerp(
                        p,
                        p1,
                        p2,
                        a1,
                        values[1][i],
                        values[2][i],
                        values[3][i],
                    )
                })
            }
            return biLerp(
                p,
                p1,
                p2,
                values[0],
                values[1] as number,
                values[2] as number,
                values[3] as number,
            )
        }
        return undefined
    }

    /**
     * Iterate aver all points of the grids and call cb = Function(x, y, i, j, flat)
     * @param cb
     */
    forEach(
        cb: (x: number, y: number, i: number, j: number, flat: number) => void,
    ) {
        let k = 0
        for (let i = 0; i < this._n[0]; ++i) {
            for (let j = 0; j < this._n[1]; ++j) {
                const p = this.positionAt(i, j)
                cb(p[0], p[1], i, j, k++)
            }
        }
    }

    /**
     * Iterate aver all points of the grids and generate a new array of the transformed point
     * by calling cb = Function(x, y, i, j, flat)
     * @param cb
     */
    map(
        cb: (
            x: number,
            y: number,
            i: number,
            j: number,
            flat: number,
        ) => number,
    ) {
        const arr = new Array(this.count)
        let k = 0
        for (let i = 0; i < this._n[0]; ++i) {
            for (let j = 0; j < this._n[1]; ++j) {
                const p = this.positionAt(i, j)
                arr[k] = cb(p[0], p[1], i, j, k++)
            }
        }
        return arr
    }
}
