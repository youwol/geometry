import { biLerp, triLerp } from "@youwol/math"
import { Manager, Serie } from "@youwol/dataframe"

export type V3 = [number, number, number]

/**
 * Represent a 3D cartesian grid (axis aligned)
 */
export class Grid3DHelper {
    private _origin = [0,0,0]
    private _n  = [0,0,0]
    private _dx = 0
    private _dy = 0
    private _dz = 0

    constructor(min: V3, max: V3, nx: number, ny: number, nz: number, eps = 1e-7) {
        this._n = [nx, ny, nz]
        this._dx = (max[0] - min[0] + 2*eps) / (nx-1)
        this._dy = (max[1] - min[1] + 2*eps) / (ny-1)
        this._dz = (max[2] - min[2] + 2*eps) / (nz-1)
        this._origin = [min[0]-eps, min[1]-eps, min[2]-eps]
    }

    get count() {return this._n[0]*this._n[1]*this._n[2]}
    get nx() {return this._n[0]}
    get ny() {return this._n[1]}
    get nz() {return this._n[2]}
    get dx() {return this._dx}
    get dy() {return this._dy}
    get dz() {return this._dz}
    get origin()  {return this._origin}
    get xLength() {return this._n[0]*this._dx}
    get yLength() {return this._n[1]*this._dy}
    get zLength() {return this._n[2]*this._dz}

    getIJK(p: [number, number, number]): any {
		const lx = p[0] - this._origin[0]
        if (lx < 0) return {ok: false}
        
		const ly = p[1] - this._origin[1]
        if (ly < 0) return {ok: false}
        
        const lz = p[2] - this._origin[2]
		if (lz < 0) return {ok: false}
        
        const xg = lx / this._dx
        if (xg > this._n[0]) return {ok: false}
        
		const yg = ly / this._dy
        if (yg > this._n[1]) return {ok: false}
        
        const zg = lz / this._dz
		if (zg > this._n[2]) return {ok: false}

		const ix = Math.trunc(xg)
        const iy = Math.trunc(yg)
        const iz = Math.trunc(yg)
		
        return {
            ok: true,
            ijk: [ix, iy, iz]
        } 
    }

    /**
     * Given the (i,j,k) indices of a cell, return its faltten index.
     * This index varies from 0 to nx*ny and is unique for each corner
     * cell of teh grid. It is mainly used to get the attribute at a given
     * position.
     */
    flatIndex(i: number, j: number, k: number): number {
        return i + this._n[0]*j + this._n[0]*this._n[1]*k
    }

    /**
     * Return the flat-indices of the 8 corners of the intersecting cell
     * with point p
     */
    flatIndices(p: [number, number, number]): [number, number, number, number, number, number, number, number] {
        const c = this.candidate(p)
        if (c === undefined) return undefined
        const i11 = this.flatIndex(c[0], c[1]  , c[2])
        const i12 = this.flatIndex(c[0], c[1]+1, c[2])
        const i21 = this.flatIndex(c[0], c[1]  , c[2]+1)
        const i22 = this.flatIndex(c[0], c[1]+1, c[2]+1)
        return [i11, i11+1, i12, i12+1, i21, i21+1, i22, i22+1]
    }

    /**
     * Given the (i,j) indices of a cell (lower-left corner),
     * return its (x,y) position
     */
    positionAt(i: number, j: number, k: number): [number, number, number] {
        const x = this._origin[0] + i*this._dx
        const y = this._origin[1] + j*this._dy
        const z = this._origin[2] + k*this._dz
        return [x, y, z]
    }

    /**
     * Get the (i,j,k) position of the intersecting cell.
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
    candidate(p: [number, number, number]): [number, number, number] {
        const {ok, ij} = this.getIJK(p)
        if (!ok) return undefined
        return ij
    }

    interpolate(p: [number, number, number], attribute: Serie): any {
        const ijk = this.getIJK(p)
        if (ijk.ok) {
            const I  = ijk.ijk[0]
            const J  = ijk.ijk[1]
            const K  = ijk.ijk[2]
            const p1 = this.positionAt(I, J, K)
            const p2 = this.positionAt(I+1, J+1, K+1)

            // order: q000, q001, q010, q011, q100, q101, q110, q111
            const ids = new Array(8)
            ids[0] = this.flatIndex(I  , J  , K)
            ids[1] = this.flatIndex(I  , J  , K+1)
            ids[2] = this.flatIndex(I  , J+1, K)
            ids[3] = this.flatIndex(I  , J+1, K+1)
            ids[4] = this.flatIndex(I+1, J  , K)
            ids[5] = this.flatIndex(I+1, J  , K+1)
            ids[6] = this.flatIndex(I+1, J+1, K)
            ids[7] = this.flatIndex(I+1, J+1, K+1)
            const values = ids.map( v => attribute.itemAt(v) )
            if (Array.isArray(values[0])) {
                return values[0].map( (a1, i) =>
                    triLerp(p, p1, p2, a1, 
                        values[1][i], values[2][i], values[3][i], values[4][i], 
                        values[5][i], values[6][i], values[7][i]) )
            }
            return triLerp(p, p1, p2, values[0], 
                values[1] as number, values[2] as number, values[3] as number, values[4] as number,
                values[5] as number, values[6] as number, values[7] as number)
        }
        return undefined
    }

    /**
     * Iterate aver all points of the grids and call cb = Function(x, y, z, i, j, k, flat)
     * @param cb 
     */
    forEach(cb: Function) {
        let l = 0
        for (let i=0; i<this._n[0] ; ++i) {
            for (let j=0; j<this._n[1] ; ++j) {
                for (let k=0; k<this._n[2] ; ++k) {
                    const p = this.positionAt(i,j,k)
                    cb(p[0], p[1], p[2], i, j, k, l++)
                }
            }
        }
    }

    /**
     * Iterate aver all points of the grids and generate a new array of the transformed point
     * by calling cb = Function(x, y, z, i, j, k, flat)
     * @param cb 
     */
    map(cb: Function) {
        const arr = new Array(this.count)
        let l = 0
        for (let i=0; i<this._n[0] ; ++i) {
            for (let j=0; j<this._n[1] ; ++j) {
                for (let k=0; k<this._n[2] ; ++k) {
                    const p = this.positionAt(i,j,k)
                    arr[l] = cb(p[0], p[1], p[2], i, j, k, l++)
                }
            }
        }
        return arr
    }
}