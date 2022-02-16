import { Serie } from '@youwol/dataframe'
import {deg2rad} from './angles'

export type TraceInfo = {
    id: string, // "no-name"
    dip: number, // 30
    dipDirection: number, // 90
    depth: number // 0.1
    rows: number, // 5

    points: Serie
}

export type SurfaceType = {
    positions: Serie,
    indices: Serie
}

/**
 * Extruce a 2D/3D trace using the dip angle, dip-direction and a depth.
 * 
 * Example:
 * ```ts
 * const trace = {
 *      is: "1",
 *      dip: 35,
 *      dipDirection: 135,
 *      depth: 1000,
 *      rows: 5,
 *      points: Serie.create({array: [0,0, 0,1, 0,2, 1,3, 2,4], itemSize: 2})
 * }
 * const surface = extrude(trace)
 * console.log(surface.positions, surface.indices)
 * ```
 */
export function extrude(trace: TraceInfo): SurfaceType {
    const t = new Trace(trace)
    return {
        positions: t.positions,
        indices  : t.indices
    }
}

// ------------------------------------------------------------

class Trace {
    public positions: Serie
    public indices: Serie
    private info: TraceInfo

    constructor(trace: TraceInfo) {
        if (trace === undefined) {
            throw new Error('data for trace is undefned')
        }

        if (trace.points.itemSize !== 2 && trace.points.itemSize !== 3) {
            throw new Error('points must be a Serie with itemSize equals to 2 or 3')
        }

        this.info = trace
        if (this.info.depth === undefined) this.info.depth = 0.1
        if (this.info.dip === undefined) this.info.dip = 30
        if (this.info.dipDirection === undefined) this.info.dipDirection = 90
        if (this.info.rows === undefined) this.info.rows = 5
        if (this.info.id === undefined) this.info.id = 'no-name'
    
        this.perform()
    }

    private pt(i: number): number[] {
        return this.info.points.itemAt(i) as number[]
    }

    private perform() {
        const N = this.info.rows
        const n = this.info.points.count
        const dip    = deg2rad(this.info.dip)
        const dipDir = deg2rad(this.info.dipDirection)

        const dh  = this.info.depth / (N-1)
        const T   = [dh * Math.sin(dipDir)*Math.cos(dip),
                     dh * Math.cos(dipDir)*Math.cos(dip), 
                     dh * Math.sin(dip)]

        const positions = []
        const indices   = []
        
        for (let j=0; j<N; ++j) {
            for (let i=0; i<n; ++i) {
                const p = this.pt(i)
                if (p.length === 3) {
                    positions.push( (p[0] + j*T[0]), (p[1] + j*T[1]), (p[2] - j*T[2]))
                }
                else {
                    positions.push( (p[0] + j*T[0]), (p[1] + j*T[1]), (- j*T[2]))
                }
            }
        }

        for (let j=0; j<N-1; ++j) {
            const start = j*n
            for (let i=0; i<n-1; ++i) { // one line of triangles
                const id = start+i
                indices.push(id,   1+id,   n+id, 1+id, n+1+id, n+id)
            }
        }

        this.positions = Serie.create({array: positions, itemSize: 3})
        this.indices   = Serie.create({array: indices  , itemSize: 3})
    }

}
